import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Users, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const links = [
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Terms of Service', href: '#terms' },
    { label: 'Crisis Resources', href: '#crisis' },
    { label: 'Contact Support', href: '#contact' }
  ];

  const socialLinks = [
    { icon: '📱', label: 'Mobile App', href: '#app' },
    { icon: '📧', label: 'Newsletter', href: '#newsletter' },
    { icon: '🤝', label: 'Community', href: '#community' }
  ];

  return (
    <footer className="relative mt-20 py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
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
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                MindSpace
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Empowering college students with stigma-free mental health support, 
              AI-powered assistance, and a caring community.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <motion.a
                    href={link.href}
                    className="text-gray-400 hover:text-cyan-400 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    {link.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Support</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-400">
                <Phone className="w-4 h-4" />
                <span className="text-sm">24/7 Crisis: 988</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm">support@mindspace.edu</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Student Health Center</span>
              </div>
            </div>
          </motion.div>

          {/* Community */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Community</h3>
            <div className="space-y-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="flex items-center space-x-2 text-gray-400 hover:text-cyan-400 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <span>{social.icon}</span>
                  <span className="text-sm">{social.label}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="pt-8 border-t border-cyan-500/20 flex flex-col md:flex-row items-center justify-between"
        >
          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4 md:mb-0">
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-green-400" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Student Verified</span>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            © 2025 MindSpace. All rights reserved. Made with 💙 for student wellbeing.
          </div>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-2xl"
        >
          <p className="text-lg text-cyan-300 font-medium italic">
            "Your mental health is just as important as your physical health. 
            You matter, your feelings are valid, and help is always available."
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;