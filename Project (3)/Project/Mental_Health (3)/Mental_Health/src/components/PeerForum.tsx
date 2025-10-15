import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Heart, 
  Users, 
  Shield,
  Clock,
  Eye,
  ThumbsUp,
  MessageSquare,
  UserCheck,
  AlertTriangle,
  Plus,
  Send,
  Image as ImageIcon,
  Video as VideoIcon, // Import Video icon for media
  Trash2, // Import for delete functionality
  Loader // Import Loader icon
} from 'lucide-react';
import api, { UserResponse } from '../services/api';

interface ForumPost {
  _id: string;
  title?: string; // Optional title, as it's not explicitly used in createPost body
  content: string;
  user_id: { // Populated user object
    _id: string;
    name: string;
    anonymous_flag: boolean;
    profile_picture?: string;
  };
  timestamp: string;
  category?: string; // Optional category, as it's not in the backend model yet
  likes?: number;
  replies?: number;
  views?: number;
  anonymous: boolean;
  flagged: boolean;
  media_url?: string; // Cloudinary URL for image/video
  tags?: string[];
}

interface PeerForumProps {
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  user: UserResponse | null; // Logged-in user to check for post ownership/admin role
}

const PeerForum: React.FC<PeerForumProps> = ({ addNotification, user }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/forum');
      setPosts(res.data);
    } catch (err: any) {
      console.error('Error fetching forum posts:', err);
      setError(err.response?.data?.msg || 'Failed to fetch forum posts');
      addNotification('Failed to load forum posts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const categories = [
    { id: 'all', label: 'All Posts', icon: MessageCircle },
    // { id: 'study-stress', label: 'Study Stress', icon: AlertTriangle }, // Categories not directly from backend yet
    // { id: 'social-anxiety', label: 'Social Anxiety', icon: Users },
    // { id: 'motivation', label: 'Motivation', icon: Heart }
  ];

  const filteredPosts = activeCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === activeCategory);

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      addNotification('Please fill in both title and content', 'error');
      return;
    }

    setIsPosting(true);
    const formData = new FormData();
    formData.append('title', newPostTitle);
    formData.append('content', newPostContent);
    formData.append('anonymous', String(isAnonymous));
    if (newPostMedia) {
      formData.append('media_file', newPostMedia);
    }

    try {
      await api.post('/forum', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      addNotification('Your post has been published successfully!', 'success');
      fetchPosts(); // Re-fetch posts to show the new one
      setShowNewPost(false);
      setNewPostTitle('');
      setNewPostContent('');
      setIsAnonymous(true);
      setNewPostMedia(null);
    } catch (err: any) {
      console.error('Error creating post:', err.response?.data || err.message);
      addNotification(err.response?.data?.msg || 'Failed to create post.', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await api.delete(`/forum/${postId}`);
      addNotification('Post deleted successfully!', 'info');
      setPosts(posts.filter(post => post._id !== postId));
    } catch (err: any) {
      console.error('Error deleting post:', err);
      addNotification(err.response?.data?.msg || 'Failed to delete post.', 'error');
    }
  };

  if (!user) {
    return (
      <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <p className="text-xl text-gray-300">Please log in to participate in the forum.</p>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Peer Support Forum
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            A safe, moderated space for students to share experiences, 
            seek support, and connect with others who understand.
          </p>

          {/* Safety Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-400/30 rounded-full mb-8"
          >
            <Shield className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-green-300 font-medium">AI-Moderated Safe Space</span>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      activeCategory === category.id
                        ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-400'
                        : 'text-gray-400 hover:bg-cyan-400/5 hover:text-cyan-300'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center space-x-2">
                      <category.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{category.label}</span>
                    </div>
                    {/* <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                      {category.count}
                    </span> */}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Community Rules</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start space-x-2">
                  <Heart className="w-3 h-3 text-red-400 mt-1 flex-shrink-0" />
                  <span>Be kind and supportive</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Shield className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                  <span>Respect privacy & anonymity</span>
                </li>
                <li className="flex items-start space-x-2">
                  <UserCheck className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                  <span>No judgment zone</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertTriangle className="w-3 h-3 text-orange-400 mt-1 flex-shrink-0" />
                  <span>Report inappropriate content</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* New Post Button */}
            <motion.button
              onClick={() => setShowNewPost(true)}
              className="w-full p-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-semibold shadow-lg flex items-center justify-center space-x-2"
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              <span>Share Your Experience</span>
            </motion.button>

            {/* New Post Modal */}
            <AnimatePresence>
              {showNewPost && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowNewPost(false)}
                >
                  <motion.div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl bg-slate-800 border border-cyan-400/30 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
                  >
                    <h3 className="text-2xl font-bold text-white mb-6">Share Your Experience</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          placeholder="What would you like to share?"
                          className="w-full p-3 bg-slate-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Content
                        </label>
                        <textarea
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          rows={6}
                          placeholder="Share your thoughts, experiences, or questions..."
                          className="w-full p-3 bg-slate-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 resize-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="media_file" className="block text-slate-300 text-sm font-bold mb-2">Media (Image/Video)</label>
                        <input
                          type="file"
                          id="media_file"
                          className="block w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                          onChange={(e) => setNewPostMedia(e.target.files ? e.target.files[0] : null)}
                        />
                        {newPostMedia && <p className="text-sm text-gray-400 mt-2">Selected: {newPostMedia.name}</p>}
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="anonymous"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="w-4 h-4 text-cyan-500 bg-slate-700 border-gray-600 rounded focus:ring-cyan-400 focus:ring-2"
                        />
                        <label htmlFor="anonymous" className="text-sm text-gray-300">
                          Post anonymously (recommended for privacy)
                        </label>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <motion.button
                          onClick={handleCreatePost}
                          className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isPosting || !newPostTitle.trim() || !newPostContent.trim()}
                        >
                          {isPosting ? 'Posting...' : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Post Safely</span>
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          onClick={() => setShowNewPost(false)}
                          className="px-6 py-3 border border-gray-600 text-gray-400 rounded-xl hover:border-gray-500 hover:text-gray-300 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isPosting}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Posts */}
            <motion.div layout className="space-y-6">
              <AnimatePresence>
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader className="animate-spin w-8 h-8 text-cyan-400" />
                    <p className="ml-4 text-gray-300">Loading forum posts...</p>
                  </div>
                ) : error ? (
                  <p className="text-center text-red-400 text-lg">{error}</p>
                ) : posts.length === 0 ? (
                  <p className="text-center text-gray-400">No posts yet. Be the first to share!</p>
                ) : (
                  filteredPosts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl hover:border-cyan-400/40 transition-all duration-300 relative"
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 20px 40px rgba(6, 182, 212, 0.1)"
                      }}
                    >
                      {post.flagged && (
                        <span className="absolute top-4 right-4 bg-red-500/20 text-red-300 text-xs px-3 py-1 rounded-full flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Flagged</span>
                        </span>
                      )}
                      <div className="flex items-start space-x-4">
                        {post.user_id.profile_picture && !post.anonymous ? (
                          <img src={post.user_id.profile_picture} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="text-3xl">{post.anonymous ? '👻' : '👤'}</div> // Generic avatar for anonymous/no profile pic
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`font-medium ${post.anonymous ? 'text-cyan-400' : 'text-white'}`}>
                              {post.anonymous ? 'Anonymous' : post.user_id.name}
                            </span>
                            {post.anonymous && (
                              <div className="flex items-center space-x-1 text-xs text-green-400 bg-green-400/20 px-2 py-1 rounded-full">
                                <Shield className="w-3 h-3" />
                                <span>Anonymous</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(post.timestamp).toLocaleString()}</span>
                            </div>
                          </div>

                          <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                            {post.title}
                          </h3>

                          <p className="text-gray-300 mb-4 leading-relaxed">
                            {post.content}
                          </p>

                          {post.media_url && (
                            <div className="mb-4 rounded-lg overflow-hidden border border-slate-700">
                              {(post.media_url.endsWith('.mp4') || post.media_url.endsWith('.webm')) ? (
                                <video controls src={post.media_url} className="w-full object-cover max-h-80" />
                              ) : (
                                <img src={post.media_url} alt="Post attachment" className="w-full object-cover max-h-80" />
                              )}
                            </div>
                          )}

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-md"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 text-gray-400">
                              <motion.button
                                className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span className="text-sm">{post.likes || 0}</span>
                              </motion.button>
                              <motion.button
                                className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm">{post.replies || 0}</span>
                              </motion.button>
                              <div className="flex items-center space-x-1 text-sm">
                                <Eye className="w-4 h-4" />
                                <span>{post.views || 0}</span>
                              </div>
                            </div>

                            {(user && (user._id === post.user_id._id || user.role === 'admin')) && (
                              <motion.button
                                onClick={() => handleDeletePost(post._id)}
                                className="flex items-center space-x-1 text-red-500 hover:text-red-400 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm">Delete</span>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>

                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                      />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerForum;