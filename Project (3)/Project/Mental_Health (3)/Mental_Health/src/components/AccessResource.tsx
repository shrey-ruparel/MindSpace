import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api'; // Assuming you have an API service to call the backend

interface AccessResourceProps {
  url: string;
  filename: string;
  resourceId: string;
}

const AccessResource: React.FC<AccessResourceProps> = ({ url, filename, resourceId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccess = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsLoading(true);
    setError(null);
    try {
      // Increment download count on the backend
      try {
        await api.post(`/resources/download/${resourceId}`);
      } catch (countError) {
        console.warn('Could not update download count:', countError);
      }
      // Create a temporary anchor and trigger download/view
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('[AccessResource] Failed to open or download resource:', err.message);
      setError(err.message || 'Could not access the resource. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={handleAccess}
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ position: 'relative', zIndex: 10 }} // Ensure button is clickable
      >
        {isLoading ? 'Processing...' : 'Access Resource'}
      </motion.button>
      {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
    </>
  );
};

export default AccessResource;

