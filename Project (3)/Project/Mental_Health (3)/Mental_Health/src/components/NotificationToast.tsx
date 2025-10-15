import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'border-green-400/40 bg-green-500/10';
      case 'error':
        return 'border-red-400/40 bg-red-500/10';
      default:
        return 'border-cyan-400/40 bg-cyan-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      className={`flex items-center space-x-3 p-4 border rounded-2xl backdrop-blur-lg ${getColorClasses()} shadow-2xl max-w-sm`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 text-white text-sm font-medium">
        {message}
      </div>
      <motion.button
        onClick={onClose}
        className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-4 h-4 text-gray-400" />
      </motion.button>
    </motion.div>
  );
};

export default NotificationToast;