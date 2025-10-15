import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Calendar,
  BookOpen,
  Heart,
  Activity,
  Brain,
  Loader
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import api from '../services/api';
import CounsellorManagement from './CounsellorManagement'; // Import CounsellorManagement
import ResourceManagement from './ResourceManagement'; // Import ResourceManagement
import { UserResponse } from '../services/api';

interface AdminDashboardProps {
  user: UserResponse | null; // User object to ensure admin access, with UserResponse type
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, addNotification }) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'counsellors' | 'resources'>('analytics');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || user.role !== 'admin') {
        // This check is already done at the top-level return, so we can skip setting error here
        return;
      }
      setLoading(true);
      try {
        const res = await api.get('/admin/analytics');
        setAnalyticsData(res.data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.response?.data?.msg || 'Failed to fetch analytics data');
        addNotification(err.response?.data?.msg || 'Failed to fetch analytics data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else {
      setLoading(false); // If not analytics tab, stop loading for analytics
    }
  }, [user, activeTab, addNotification]);

  const stats = [
    {
      title: 'Total Users',
      value: analyticsData?.totalUsers,
      icon: Users,
      color: 'from-cyan-400 to-blue-500'
    },
    {
      title: 'Total Appointments',
      value: analyticsData?.totalAppointments,
      icon: Calendar,
      color: 'from-purple-400 to-pink-500'
    },
    {
      title: 'Flagged Forum Posts',
      value: analyticsData?.flaggedPosts,
      icon: BookOpen,
      color: 'from-green-400 to-teal-500'
    },
    {
      title: 'Avg. PHQ-9 Score',
      value: analyticsData?.averagePhq9Score ? analyticsData.averagePhq9Score.toFixed(2) : 'N/A',
      icon: Heart,
      color: 'from-orange-400 to-red-500'
    }
  ];

  // Mock data for charts, replace with real data when available in analyticsData
  const wellnessTrendsData = [
    { name: 'Jan', stress: 65, wellbeing: 70, engagement: 80 },
    { name: 'Feb', stress: 60, wellbeing: 75, engagement: 85 },
    { name: 'Mar', stress: 55, wellbeing: 78, engagement: 88 },
    { name: 'Apr', stress: 70, wellbeing: 65, engagement: 75 },
    { name: 'May', stress: 45, wellbeing: 85, engagement: 92 },
    { name: 'Jun', stress: 40, wellbeing: 88, engagement: 95 }
  ];

  const topConcernsData = [
    { name: 'Exam Anxiety', value: 68 },
    { name: 'Social Isolation', value: 52 },
    { name: 'Sleep Issues', value: 47 },
    { name: 'Time Management', value: 43 },
    { name: 'Financial Stress', value: 38 }
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <p className="text-xl text-red-400">Admin access required to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Manage platform content and view analytics.
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 mb-8">
          <button
            className={`py-3 px-6 text-lg font-medium transition-colors ${activeTab === 'analytics' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('analytics')}
          >
            Wellness Analytics
          </button>
          <button
            className={`py-3 px-6 text-lg font-medium transition-colors ${activeTab === 'counsellors' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('counsellors')}
          >
            Counsellors Management
          </button>
          <button
            className={`py-3 px-6 text-lg font-medium transition-colors ${activeTab === 'resources' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources Management
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin w-10 h-10 text-cyan-400" />
                <p className="ml-4 text-lg text-gray-300">Loading analytics...</p>
              </div>
            ) : error ? (
              <p className="text-center text-red-400 text-lg">{error}</p>
            ) : (
              <>
                {/* Stats Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="group p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl hover:border-cyan-400/40 transition-all duration-300"
                      whileHover={{
                        y: -5,
                        boxShadow: "0 20px 40px rgba(6, 182, 212, 0.2)"
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} p-3 group-hover:scale-110 transition-transform duration-300`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                        {stat.value}
                      </h3>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                        {stat.title}
                      </p>

                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}
                        initial={false}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  {/* Wellness Trends Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2 p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl"
                  >
                    <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                      <TrendingUp className="w-6 h-6 text-cyan-400 mr-2" />
                      Wellness Trends
                    </h3>

                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData?.wellnessTrendsData || wellnessTrendsData} margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #06b6d4', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="stress" stroke="#ef4444" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="wellbeing" stroke="#22c55e" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="engagement" stroke="#06b6d4" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Top Concerns Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl"
                  >
                    <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                      <Brain className="w-6 h-6 text-purple-400 mr-2" />
                      Top Concerns
                    </h3>

                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData?.topConcernsData || topConcernsData} margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #06b6d4', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl"
                >
                  <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                    <Activity className="w-6 h-6 text-green-400 mr-2" />
                    Recent Activity
                  </h3>

                  <div className="space-y-4">
                    <p className="text-gray-400">No recent activity to display from backend.</p>
                  </div>
                </motion.div>

                {/* Success Metrics */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  <div className="text-center p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 rounded-2xl">
                    <div className="text-4xl mb-4">📈</div>
                    <h4 className="text-2xl font-bold text-green-400 mb-2">73%</h4>
                    <p className="text-gray-300">Report improved mood after using platform</p>
                  </div>

                  <div className="text-center p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 rounded-2xl">
                    <div className="text-4xl mb-4">🎯</div>
                    <h4 className="text-2xl font-bold text-cyan-400 mb-2">85%</h4>
                    <p className="text-gray-300">Successfully completed wellness programs</p>
                  </div>

                  <div className="text-center p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 rounded-2xl">
                    <div className="text-4xl mb-4">⭐</div>
                    <h4 className="text-2xl font-bold text-purple-400 mb-2">4.8/5</h4>
                    <p className="text-gray-300">Average user satisfaction rating</p>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'counsellors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CounsellorManagement addNotification={addNotification} />
          </motion.div>
        )}

        {activeTab === 'resources' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ResourceManagement addNotification={addNotification} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;