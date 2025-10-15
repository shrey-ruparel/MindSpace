import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle, MapPin, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface EmergencyButtonProps {
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  user: any; // Add user prop
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({ addNotification, user }) => {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false); // For showing contacts after confirmation
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // For the initial SOS confirmation
  const [isPulsing, setIsPulsing] = useState(true);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Function to get user's location
  const getUserLocation = () => {
    return new Promise<string | null>((resolve) => {
      if (!('geolocation' in navigator)) {
        setLocationError('Geolocation is not supported by your browser.');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLocation = `Lat: ${latitude}, Lon: ${longitude}`;
          setLocation(userLocation);
          resolve(userLocation);
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out.';
              break;
            default:
              break;
          }
          setLocationError(errorMessage);
          addNotification(`Location error: ${errorMessage}`, 'error');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleSendSOS = async () => {
    if (!user) {
      addNotification('Please log in to use SOS functionality.', 'error');
      setShowConfirmationModal(false);
      return;
    }

    setIsSendingSOS(true);
    setLocationError(null);

    let userLocation: string | null = null;
    if (user.role === 'student') { // Only attempt to get location for students
      userLocation = await getUserLocation();
    }

    try {
      const sosData = {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        location: userLocation || 'Location Not Provided', // Use retrieved location or a default
      };
      
      await api.post('/emergency/sos', sosData); // New endpoint for SOS
      addNotification('SOS alert sent successfully to support staff.', 'success');
    } catch (err) {
      console.error('Error sending SOS alert:', err);
      addNotification('Failed to send SOS alert. Please try again.', 'error');
    } finally {
      setIsSendingSOS(false);
      setShowConfirmationModal(false); // Close confirmation modal
      setShowEmergencyModal(true); // Always show emergency contacts after SOS attempt
    }
  };

  const handleImOkay = () => {
    addNotification('Glad to hear you\'re okay. Remember, help is always available 💙', 'info');
    setShowConfirmationModal(false);
    setShowEmergencyModal(true); // Still show emergency contacts
  };

  const emergencyContacts = [
    {
      name: 'National Crisis Hotline',
      number: '988',
      description: '24/7 crisis support and suicide prevention',
      icon: Phone,
      color: 'from-red-500 to-pink-500'
    },
    {
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Free, 24/7 crisis support via text',
      icon: MessageCircle,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Campus Safety',
      number: '(555) 123-SAFE',
      description: 'Campus emergency and safety services',
      icon: MapPin,
      color: 'from-green-500 to-teal-500'
    },
    {
      name: 'Campus Counseling',
      number: '(555) 123-HELP',
      description: 'After-hours counseling emergency line',
      icon: Clock,
      color: 'from-purple-500 to-indigo-500'
    }
  ];

  return (
    <>
      {/* Emergency Button */}
      <motion.button
        onClick={() => setShowConfirmationModal(true)}
        className="fixed top-20 right-4 w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-2xl z-40 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: isPulsing ? [
            "0 0 0 0 rgba(239, 68, 68, 0.7)",
            "0 0 0 20px rgba(239, 68, 68, 0)",
          ] : "0 0 20px rgba(239, 68, 68, 0.5)",
          scale: isPulsing ? [1, 1.05, 1] : 1
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          },
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <div className="text-white text-lg font-bold">SOS</div>
      </motion.button>

      {/* SOS Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmationModal(false)} // Click outside to close
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gradient-to-br from-red-800/95 to-red-900/95 backdrop-blur-lg border border-red-400/30 rounded-2xl p-6 text-center"
            >
              <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">Confirm SOS Alert</h2>
              <p className="text-red-100 mb-6">
                Are you sure you want to send an immediate SOS alert to support staff?
                This will notify all available counsellors and administrators.
              </p>
              {locationError && <p className="text-yellow-300 text-sm mb-4">{locationError} You can still send SOS without location.</p>}
              <div className="flex justify-center space-x-4">
                <motion.button
                  onClick={handleSendSOS}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSendingSOS}
                >
                  {isSendingSOS ? 'Sending...' : 'Confirm Send SOS'}
                </motion.button>
                <motion.button
                  onClick={handleImOkay}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSendingSOS}
                >
                  I am OK
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Modal (Existing, now shown after confirmation or I'm OK) */}
      <AnimatePresence>
        {showEmergencyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEmergencyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg border border-red-400/30 rounded-2xl p-6"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center"
                >
                  <div className="text-white text-2xl font-bold">🆘</div>
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Emergency Support</h2>
                <p className="text-gray-300 max-w-md mx-auto">
                  If you're experiencing a mental health crisis, you're not alone. 
                  Help is available 24/7.
                </p>
              </div>

              {/* Emergency Contacts */}
              <div className="grid gap-4 mb-8">
                {emergencyContacts.map((contact, index) => (
                  <motion.div
                    key={contact.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`p-4 bg-gradient-to-r ${contact.color} bg-opacity-10 border border-current border-opacity-30 rounded-2xl hover:border-opacity-50 transition-all cursor-pointer group`}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      // In a real app, this would initiate the call
                      addNotification(`Connecting to ${contact.name}...`, 'info');
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${contact.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <contact.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-red-300 transition-colors">
                          {contact.name}
                        </h3>
                        <p className="text-red-300 font-mono text-lg">{contact.number}</p>
                        <p className="text-gray-400 text-sm">{contact.description}</p>
                      </div>
                      <div className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Important Notice */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-2xl mb-6"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-400 text-xl">⚠️</div>
                  <div>
                    <h4 className="font-semibold text-yellow-300 mb-1">Important</h4>
                    <p className="text-yellow-200 text-sm">
                      If you're in immediate danger, call emergency services (911) right away. 
                      These resources are for crisis support and mental health emergencies.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Close Button */}
              <div className="flex justify-center space-x-4">
                <motion.button
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-8 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowEmergencyModal(false);
                    addNotification('Remember: You matter and help is always available 💙', 'info');
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  I'm Okay Now
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyButton;