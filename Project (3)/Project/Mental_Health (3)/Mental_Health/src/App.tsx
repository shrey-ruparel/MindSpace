import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AIChat from './components/AIChat';
import AppointmentBooking from './components/AppointmentBooking';
import ResourceHub from './components/ResourceHub';
import PeerForum from './components/PeerForum';
import AdminDashboard from './components/AdminDashboard';
import WellnessTracker from './components/WellnessTracker';
import EmergencyButton from './components/EmergencyButton';
import NotificationToast from './components/NotificationToast';
import Footer from './components/Footer';
import Auth from './components/Auth'; // Import the new Auth component
import CounsellorProfileForm from './components/CounsellorProfileForm';
import CounsellorAppointmentManagement from './components/CounsellorAppointmentManagement'; // Import new component
import api, { UserResponse, AuthResponse } from './services/api';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [showChat, setShowChat] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9); // More unique ID
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        try {
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          setIsAuthenticated(true);
          setUser(res.data);
          addNotification(`Welcome back, ${res.data.name}!`, 'success');
        } catch (err) {
          console.error('Failed to authenticate user with access token', err);
          // Attempt to refresh token if access token fails
          try {
            const refreshRes = await api.post('/auth/refresh-token', { refreshToken });
            localStorage.setItem('accessToken', refreshRes.data.accessToken);
            localStorage.setItem('refreshToken', refreshRes.data.refreshToken);
            const res = await api.get('/auth/me', {
              headers: { Authorization: `Bearer ${refreshRes.data.accessToken}` }
            });
            setIsAuthenticated(true);
            setUser(res.data);
            addNotification('Session refreshed!', 'success');
          } catch (refreshErr) {
            console.error('Failed to refresh token', refreshErr);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
            setUser(null);
            addNotification('Session expired, please log in again.', 'error');
          }
        }
      } else if (refreshToken) {
        // Only refresh token exists, try to get new access token
        try {
          const refreshRes = await api.post('/auth/refresh-token', { refreshToken });
          localStorage.setItem('accessToken', refreshRes.data.accessToken);
          localStorage.setItem('refreshToken', refreshRes.data.refreshToken);
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${refreshRes.data.accessToken}` }
          });
          setIsAuthenticated(true);
          setUser(res.data);
          addNotification('Session refreshed!', 'success');
        } catch (refreshErr) {
          console.error('Failed to refresh token on startup', refreshErr);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setIsAuthenticated(false);
          setUser(null);
          addNotification('Session expired, please log in again.', 'error');
        }
      }
    };
    checkAuth();

    // Welcome notification
    setTimeout(() => {
      if (!isAuthenticated) {
        addNotification('Welcome to your mental wellness companion! 💙', 'success');
      }
    }, 2000);

    // Periodic wellness reminder
    const interval = setInterval(() => {
      if (isAuthenticated) {
        addNotification('Remember to take a deep breath and check in with yourself 🧘‍♀️', 'info');
      }
    }, 120000); // Every 2 minutes for demo

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleAuthSuccess = (authData: AuthResponse) => {
    setIsAuthenticated(true);
    setUser(authData.user);
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
    setShowAuthModal(false);
    addNotification('Authentication successful!', 'success');
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
    setActiveSection('home');
    addNotification('Logged out successfully.', 'info');
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeInOut" } // Use a common string literal easing
    }
  };

  const renderActiveSection = () => {
    if (!isAuthenticated && activeSection !== 'home') {
      // Redirect to home or show auth modal if not authenticated and trying to access private sections
      // For now, let's just show the auth modal
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-3xl font-bold mb-4">Please log in to access this section</h2>
          <button 
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition duration-300"
          >
            Login / Register
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case 'appointments':
        return <AppointmentBooking addNotification={addNotification} user={user} />;
      case 'resources':
        return <ResourceHub user={user} />;
      case 'forum':
        return <PeerForum addNotification={addNotification} user={user} />;
      case 'dashboard':
        return user && user.role === 'admin' ? <AdminDashboard user={user} addNotification={addNotification} /> : <p>Access Denied</p>;
      case 'counsellor-profile':
        return user && user.role === 'counsellor' ? (
          <CounsellorProfileForm 
            user={user} 
            addNotification={addNotification} 
            onProfileUpdated={() => addNotification("Profile update initiated!")}
          />
        ) : (
          <p>Access Denied</p>
        );
      case 'counsellor-appointments':
        return user && user.role === 'counsellor' ? (
          <CounsellorAppointmentManagement
            user={user}
            addNotification={addNotification}
          />
        ) : (
          <p>Access Denied</p>
        );
      default:
        return <Hero setActiveSection={setActiveSection} isAuthenticated={isAuthenticated} setShowAuthModal={setShowAuthModal} user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-x-hidden">
      {/* Animated background patterns */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <Navbar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        isAuthenticated={isAuthenticated} 
        user={user}
        onLogout={handleLogout}
        onShowAuthModal={() => setShowAuthModal(true)}
      />
      
      <motion.main
        key={activeSection}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        {renderActiveSection()}
      </motion.main>

      <WellnessTracker addNotification={addNotification} user={user} />
      <EmergencyButton addNotification={addNotification} user={user} />

      <AnimatePresence>
        {showChat && (
          <AIChat 
            showChat={showChat} 
            setShowChat={setShowChat} 
            addNotification={addNotification}
            isAuthenticated={isAuthenticated}
            user={user}
          />
        )}
      </AnimatePresence>

      {/* Floating Chat Toggle */}
      <motion.button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-2xl z-50 flex items-center justify-center group"
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 0 30px rgba(6, 182, 212, 0.8)"
        }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: showChat 
            ? "0 0 20px rgba(6, 182, 212, 0.6)"
            : ["0 0 10px rgba(6, 182, 212, 0.4)", "0 0 20px rgba(6, 182, 212, 0.8)", "0 0 10px rgba(6, 182, 212, 0.4)"]
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: showChat ? 0 : Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <motion.div
          animate={{ rotate: showChat ? 45 : 0 }}
          className="text-2xl"
        >
          {showChat ? '✕' : '💬'}
        </motion.div>
      </motion.button>

      <Footer />

      {/* Notification System */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map(notification => (
            <NotificationToast
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            />
          ))}
        </AnimatePresence>
      </div>

      {showAuthModal && (
        <Auth 
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          addNotification={addNotification}
        />
      )}
    </div>
  );
}

export default App;