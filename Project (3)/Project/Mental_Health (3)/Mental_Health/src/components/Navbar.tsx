import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, BookOpen, Users, BarChart3, Home, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { UserResponse } from '../services/api';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isAuthenticated: boolean;
  user: UserResponse | null;
  onLogout: () => void;
  onShowAuthModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeSection, setActiveSection, isAuthenticated, user, onLogout, onShowAuthModal }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: Calendar, authRequired: true, hiddenForRoles: ['counsellor'] },
    { id: 'resources', label: 'Resources', icon: BookOpen, hiddenForRoles: ['counsellor'] },
    { id: 'forum', label: 'Peer Support', icon: Users, authRequired: true, hiddenForRoles: ['counsellor'] },
    { id: 'dashboard', label: 'Admin', icon: BarChart3, authRequired: true, roles: ['admin'] },
    { id: 'counsellor-profile', label: 'My Profile', icon: UserIcon, authRequired: true, roles: ['counsellor'] },
    { id: 'counsellor-appointments', label: 'Manage Appointments', icon: Calendar, authRequired: true, roles: ['counsellor'] },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-b border-cyan-500/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
          >
            <div className="relative">
              <Heart className="w-8 h-8 text-cyan-400" />
              <motion.div
                className="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              MindSpace
            </span>
          </motion.div>

          {/* Navigation Items (Desktop) */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(({ id, label, icon: Icon, authRequired, roles, hiddenForRoles }) => {
              if (authRequired && !isAuthenticated) return null;
              if (hiddenForRoles && user && hiddenForRoles.includes(user.role)) return null;
              if (roles && user && !roles.includes(user.role)) return null;
              return (
                <motion.button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === id 
                      ? 'text-cyan-400' 
                      : 'text-gray-300 hover:text-cyan-400'
                  }`}
                  whileHover={{ 
                    scale: 1.05,
                    textShadow: "0 0 8px rgba(6, 182, 212, 0.8)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                  {activeSection === id && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full shadow-lg shadow-cyan-400/50"
                    />
                  )}
                </motion.button>
              );
            })}
            {isAuthenticated ? (
              <>
                {user?.role !== 'counsellor' && (
                  <motion.button
                    onClick={() => user?.role === 'counsellor' ? setActiveSection('counsellor-profile') : null}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${user?.role === 'counsellor' ? 'cursor-pointer hover:bg-cyan-400/10 transition-colors' : ''}`}
                    whileHover={{ scale: user?.role === 'counsellor' ? 1.05 : 1 }}
                    whileTap={{ scale: user?.role === 'counsellor' ? 0.95 : 1 }}
                  >
                    {user && user.profile_picture ? (
                      <img src={user.profile_picture} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-gray-300 text-sm font-medium">{user?.name || user?.email}</span>
                  </motion.button>
                )}
                <motion.button
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={onShowAuthModal}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-400/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn className="w-4 h-4" />
                <span className="text-sm font-medium">Login</span>
              </motion.button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-cyan-400 hover:text-cyan-300 p-2 rounded-lg hover:shadow-lg hover:shadow-cyan-400/30"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className="w-full h-0.5 bg-current rounded-full"></div>
                <div className="w-full h-0.5 bg-current rounded-full"></div>
                <div className="w-full h-0.5 bg-current rounded-full"></div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden bg-slate-800/95 border-t border-cyan-500/20"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-4 py-3 space-y-2">
              {navItems.map(({ id, label, icon: Icon, authRequired, roles, hiddenForRoles }) => {
                if (authRequired && !isAuthenticated) return null;
                if (hiddenForRoles && user && hiddenForRoles.includes(user.role)) return null;
                if (roles && user && !roles.includes(user.role)) return null;
                return (
                  <motion.button
                    key={id}
                    onClick={() => {
                      setActiveSection(id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left ${
                      activeSection === id 
                        ? 'text-cyan-400 bg-cyan-400/10' 
                        : 'text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/5'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </motion.button>
                );
              })}
              {isAuthenticated ? (
                <motion.button
                  onClick={onLogout}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => {
                    onShowAuthModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left text-green-400 hover:text-green-300 hover:bg-green-400/10 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm font-medium">Login</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;