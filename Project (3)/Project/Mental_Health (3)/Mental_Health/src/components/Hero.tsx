import { motion } from 'framer-motion';
import { Brain, Shield, Users, Clock, Sparkles, ArrowRight } from 'lucide-react';

interface HeroProps {
  setActiveSection: (section: string) => void;
  isAuthenticated: boolean;
  setShowAuthModal: (show: boolean) => void;
  user: any; // Add user prop
}

const Hero: React.FC<HeroProps> = ({ setActiveSection, isAuthenticated, setShowAuthModal, user }) => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Support',
      description: '24/7 intelligent assistance for immediate mental health support',
      color: 'from-cyan-400 to-blue-500'
    },
    {
      icon: Shield,
      title: 'Complete Confidentiality',
      description: 'Your privacy is protected with end-to-end encryption',
      color: 'from-blue-400 to-purple-500'
    },
    {
      icon: Users,
      title: 'Peer Community',
      description: 'Connect with fellow students in a safe, supportive environment',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Book appointments that fit your academic schedule',
      color: 'from-pink-400 to-red-500'
    }
  ];

  const actionCards = [
    {
      title: 'Start a Session',
      description: 'Connect with a counselor now',
      action: () => setActiveSection('appointments'),
      icon: '🎯',
      glow: 'hover:shadow-cyan-400/50'
    },
    {
      title: 'Explore Resources',
      description: 'Meditation, guides, and tools',
      action: () => setActiveSection('resources'),
      icon: '📚',
      glow: 'hover:shadow-blue-400/50'
    },
    {
      title: 'Join Community',
      description: 'Connect with peer support',
      action: () => setActiveSection('forum'),
      icon: '🤝',
      glow: 'hover:shadow-purple-400/50'
    }
  ];

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-400 mr-2" />
              <span className="text-cyan-300 text-sm font-medium">Stigma-Free Mental Health Support</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              Your Digital
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Wellness Companion
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Empowering college students with AI-powered mental health support, 
              confidential counseling, and a supportive peer community.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.button
                onClick={() => {
                  if (isAuthenticated) {
                    if (user?.role === 'counsellor') {
                      setActiveSection('counsellor-appointments');
                    } else {
                      setActiveSection('appointments');
                    }
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold text-white shadow-2xl overflow-hidden"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 40px rgba(6, 182, 212, 0.6)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative z-10 flex items-center">
                  {isAuthenticated ? 'Get Started Now' : 'Login / Register'}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                />
              </motion.button>

              <motion.button
                onClick={() => setActiveSection('resources')}
                className="px-8 py-4 border-2 border-cyan-400/50 text-cyan-400 rounded-xl font-semibold hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-300"
                whileHover={{ 
                  scale: 1.05,
                  textShadow: "0 0 8px rgba(6, 182, 212, 0.8)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Resources
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                className="group relative p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl hover:border-cyan-400/40 transition-all duration-300"
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 40px rgba(6, 182, 212, 0.2)"
                }}
              >
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {actionCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                onClick={card.action}
                className={`group cursor-pointer p-8 bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm border border-cyan-500/30 rounded-2xl hover:border-cyan-400/60 transition-all duration-300 ${card.glow} hover:shadow-2xl`}
                whileHover={{ 
                  y: -5,
                  scale: 1.02
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {card.description}
                </p>
                <motion.div
                  className="mt-4 flex items-center text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  <span className="font-medium mr-2">Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Hero;