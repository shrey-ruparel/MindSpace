import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Award, Flame, Star, Calendar } from 'lucide-react';
import api from '../services/api';

interface WellnessTrackerProps {
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  user: any; // Add user prop
}

const WellnessTracker: React.FC<WellnessTrackerProps> = ({ addNotification, user }) => {
  const [showTracker, setShowTracker] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const errorNotifiedRef = useRef(false);
  useEffect(() => {
    const fetchGamificationStats = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await api.get('/gamification/stats');
        const { streak = 0, badges = [] } = res.data || {};
        setCurrentStreak(streak);
        setAchievements([
          {
            id: '1',
            title: '7-Day Meditation Streak',
            description: 'Completed daily meditation for a week',
            icon: '🧘‍♀️',
            earned: streak >= 7,
            progress: streak > 7 ? 7 : streak,
            maxProgress: 7,
            color: 'from-green-400 to-teal-500'
          },
          {
            id: '2',
            title: 'Wellness Warrior',
            description: 'Used 3 different wellness resources',
            icon: '🏆',
            earned: badges.length >= 3,
            progress: badges.length > 3 ? 3 : badges.length,
            maxProgress: 3,
            color: 'from-blue-400 to-cyan-500'
          },
          {
            id: '3',
            title: 'Consistency King',
            description: 'Logged in for 14 days straight',
            icon: '🔥',
            earned: streak >= 14,
            progress: streak > 14 ? 14 : streak,
            maxProgress: 14,
            color: 'from-yellow-400 to-orange-500'
          },
          {
            id: '4',
            title: 'Stress Buster',
            description: 'Complete 10 breathing exercises',
            icon: '🌬️',
            earned: false,
            progress: 0,
            maxProgress: 10,
            color: 'from-orange-400 to-red-500'
          }
        ]);
        errorNotifiedRef.current = false;
      } catch (err: any) {
        console.error('Error fetching gamification stats:', err);
        setError(err.response?.data?.msg || 'Failed to fetch gamification stats');
        if (!errorNotifiedRef.current) {
          addNotification('Failed to load wellness data.', 'error');
          errorNotifiedRef.current = true;
        }
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchGamificationStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const weeklyGoals = [
    { day: 'Mon', completed: true, activity: 'Meditation' },
    { day: 'Tue', completed: false, activity: 'Journaling' },
    { day: 'Wed', completed: true, activity: 'Exercise' },
    { day: 'Thu', completed: false, activity: 'Reading' },
    { day: 'Fri', completed: true, activity: 'Breathing' },
    { day: 'Sat', completed: true, activity: 'Self-Care' },
    { day: 'Sun', completed: true, activity: 'Reflection' }
  ];

  if (!user) {
    return null; // Don't show tracker if not logged in
  }

  return (
    <>
      {/* Floating Tracker Button */}
      <motion.button
        onClick={() => setShowTracker(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl z-40 flex items-center justify-center group"
        whileHover={{ 
          scale: 1.1,
          boxShadow: "0 0 30px rgba(168, 85, 247, 0.8)"
        }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            "0 0 10px rgba(168, 85, 247, 0.4)",
            "0 0 20px rgba(168, 85, 247, 0.8)",
            "0 0 10px rgba(168, 85, 247, 0.4)"
          ]
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <Flame className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span className="text-xs text-white font-bold">{currentStreak}</span>
        </motion.div>
      </motion.button>

      {/* Tracker Modal */}
      <AnimatePresence>
        {showTracker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTracker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg border border-cyan-400/30 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Wellness Tracker</h2>
                    <p className="text-gray-400">Your journey to better mental health</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowTracker(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="w-6 h-6 text-gray-400">✕</div>
                </motion.button>
              </div>

              {loading ? (
                <p className="text-center text-gray-400">Loading wellness data...</p>
              ) : error ? (
                <p className="text-center text-red-400">{error}</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Current Streak */}
                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">Current Streak</h3>
                        <Flame className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                          className="text-6xl font-bold text-orange-400 mb-2"
                        >
                          {currentStreak}
                        </motion.div>
                        <p className="text-gray-300">Days of consistent wellness activities</p>
                      </div>
                    </motion.div>

                    {/* Weekly Progress */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">This Week</h3>
                        <Calendar className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {weeklyGoals.map((goal, index) => (
                          <motion.div
                            key={goal.day}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="text-center"
                          >
                            <div className="text-xs text-gray-400 mb-2">{goal.day}</div>
                            <motion.div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                goal.completed 
                                  ? 'bg-green-500/20 border-2 border-green-400' 
                                  : 'bg-gray-700 border-2 border-gray-600'
                              }`}
                              whileHover={{ scale: 1.1 }}
                            >
                              {goal.completed ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-green-400 text-lg"
                                >
                                  ✓
                                </motion.div>
                              ) : (
                                <div className="text-gray-400 text-lg">○</div>
                              )}
                            </motion.div>
                            <div className="text-xs text-gray-500 mt-1">{goal.activity}</div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Achievements */}
                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">Achievements</h3>
                        <Award className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="space-y-4">
                        {achievements.map((achievement, index) => (
                          <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className={`p-4 border rounded-2xl transition-all ${
                              achievement.earned
                                ? 'border-purple-400/40 bg-purple-500/10'
                                : 'border-gray-600 bg-gray-700/20'
                            }`}
                            whileHover={{ 
                              scale: 1.02,
                              boxShadow: achievement.earned 
                                ? "0 0 20px rgba(168, 85, 247, 0.3)"
                                : "0 0 10px rgba(107, 114, 128, 0.3)"
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <motion.div
                                className={`text-3xl ${achievement.earned ? '' : 'grayscale opacity-50'}`}
                                animate={achievement.earned ? {
                                  rotate: [0, 10, -10, 0],
                                  scale: [1, 1.1, 1]
                                } : {}}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                {achievement.icon}
                              </motion.div>
                              <div className="flex-1">
                                <h4 className={`font-semibold ${
                                  achievement.earned ? 'text-white' : 'text-gray-400'
                                }`}>
                                  {achievement.title}
                                </h4>
                                <p className="text-sm text-gray-500">{achievement.description}</p>
                                <div className="mt-2">
                                  <div className="w-full bg-gray-700 rounded-full h-2">
                                    <motion.div
                                      className={`h-2 rounded-full bg-gradient-to-r ${achievement.color}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                                      transition={{ delay: 0.8 + index * 0.1, duration: 1 }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {achievement.progress}/{achievement.maxProgress}
                                  </div>
                                </div>
                              </div>
                              {achievement.earned && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 1 + index * 0.1 }}
                                >
                                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Motivational Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-8 p-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-2xl text-center"
              >
                <h4 className="text-lg font-semibold text-cyan-300 mb-2">
                  Keep up the great work! 🌟
                </h4>
                <p className="text-gray-300">
                  You're building healthy habits that will benefit your mental health for years to come.
                </p>
                <motion.button
                  onClick={() => {
                    addNotification('Daily check-in completed! Keep going! 💪', 'success');
                    setShowTracker(false);
                  }}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Complete Daily Check-in
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WellnessTracker;