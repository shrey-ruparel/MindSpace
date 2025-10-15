import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Minimize2, Bot, User } from 'lucide-react';
import api, { UserResponse } from '../services/api';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatProps {
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  isAuthenticated: boolean;
  user: UserResponse | null; // User object from auth context
}

const AIChat: React.FC<AIChatProps> = ({ showChat, setShowChat, addNotification, isAuthenticated, user }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm Alex, your AI wellness companion. I'm here to listen and provide support. How are you feeling today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Use the new /api/chatbot/query endpoint
      const res = await api.post('/chatbot/query', { userId: user?._id, query: inputText });
      const aiResponse: Message = {
        id: Date.now() + 1,
        text: res.data.response,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error('Error sending message to AI:', error);
      addNotification('Failed to get AI response. Please try again.', 'error');
      const errorResponse: Message = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render a login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        className="fixed bottom-24 right-6 w-96 h-[500px] bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg border border-cyan-400/30 rounded-2xl shadow-2xl z-40 flex flex-col items-center justify-center text-center p-4"
        style={{ 
          boxShadow: "0 0 40px rgba(6, 182, 212, 0.3)" 
        }}
      >
        <h3 className="text-xl font-semibold mb-4">Please log in to use the AI Chatbot</h3>
        <p className="text-gray-400">Your conversations are private and secure.</p>
        <button 
          onClick={() => { /* This should ideally open the auth modal from App.tsx */ alert("Login functionality not directly available here."); }}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition duration-300"
        >
          Login
        </button>
        <motion.button
          onClick={() => setShowChat(false)}
          className="absolute top-4 right-4 p-2 hover:bg-cyan-400/10 rounded-lg transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Minimize2 className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      className="fixed bottom-24 right-6 w-96 h-[500px] bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg border border-cyan-400/30 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden"
      style={{ 
        boxShadow: "0 0 40px rgba(6, 182, 212, 0.3)" 
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <div className="flex items-center space-x-3">
          <motion.div
            className="relative w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 10px rgba(6, 182, 212, 0.5)",
                "0 0 20px rgba(6, 182, 212, 0.8)",
                "0 0 10px rgba(6, 182, 212, 0.5)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Bot className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-white">AI Wellness Companion</h3>
            <p className="text-xs text-cyan-300">Online • Always here to help</p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowChat(false)}
          className="p-2 hover:bg-cyan-400/10 rounded-lg transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Minimize2 className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
        </motion.button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                }`}>
                  {message.sender === 'user' ? (
                    user && user.profile_picture ? (
                      <img src={user.profile_picture} alt="User" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <motion.div
                  className={`p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30'
                      : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30'
                  }`}
                  whileHover={{ 
                    boxShadow: message.sender === 'user' 
                      ? "0 0 15px rgba(168, 85, 247, 0.3)"
                      : "0 0 15px rgba(6, 182, 212, 0.3)"
                  }}
                >
                  <p className="text-white text-sm leading-relaxed">{message.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-end space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 p-3 rounded-2xl">
                <div className="flex space-x-1">
                  <motion.div
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-cyan-400/20 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              rows={1}
              className="w-full bg-slate-700/50 border border-cyan-400/30 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 resize-none"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className={`p-2 rounded-xl transition-all ${
              inputText.trim()
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-400/30'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={inputText.trim() ? { scale: 1.05 } : {}}
            whileTap={inputText.trim() ? { scale: 0.95 } : {}}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {['Feeling stressed', 'Need breathing exercise', 'Study anxiety'].map((action) => (
            <motion.button
              key={action}
              onClick={() => setInputText(action)}
              className="px-3 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-400/30 hover:bg-cyan-500/30 hover:border-cyan-400/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {action}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AIChat;