import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Play,
  Headphones,
  FileText,
  Brain,
  Zap,
  Search,
  Star,
  Download,
  Clock,
  UploadCloud, // New import for upload icon
  // X, // Remove unused import
  Loader // Import Loader icon
} from 'lucide-react';
import api from '../services/api';
import AccessResource from './AccessResource';

interface Resource {
  _id: string;
  title: string;
  description: string; // Add description field
  category: string;
  type: 'pdf' | 'audio' | 'video' | 'text' | 'tool' | 'guide'; // Expanded types
  file_url: string; // Cloudinary URL
  user_id: {
    _id: string;
    name: string;
  }; // Counsellor who added the resource
  duration?: string;
  rating?: number;
  downloads?: number;
  tags?: string[];
  thumbnail?: string; // If using a separate thumbnail URL
  color?: string; // For UI styling
}

interface ResourceHubProps {
  user: any; // User object to check role for admin uploads
}

const ResourceHub: React.FC<ResourceHubProps> = ({ user }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.get('/resources');
      // Add default descriptions if missing from backend for seeded data
      const fetchedResources = res.data.map((resource: Resource) => ({
        ...resource,
        description: resource.description || 'No description provided.',
      }));
      setResources(fetchedResources);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      setError(err.response?.data?.msg || 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const categories = [
    { id: 'all', label: 'All Resources', icon: BookOpen, color: 'from-cyan-400 to-blue-500' },
    { id: 'videos', label: 'Videos', icon: Play, color: 'from-purple-400 to-pink-500' },
    { id: 'audio', label: 'Audio', icon: Headphones, color: 'from-green-400 to-teal-500' },
    { id: 'pdf', label: 'PDFs', icon: FileText, color: 'from-orange-400 to-red-500' },
    { id: 'text', label: 'Text', icon: Brain, color: 'from-indigo-400 to-purple-500' },
    { id: 'tool', label: 'Tools', icon: Zap, color: 'from-yellow-400 to-orange-500' }, // New category for tools
    { id: 'guide', label: 'Guides', icon: BookOpen, color: 'from-blue-400 to-cyan-500' } // New category for guides
  ];

  const filteredResources = resources.filter(resource => {
    const matchesCategory = activeCategory === 'all' || resource.type === activeCategory || resource.category.toLowerCase() === activeCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const ResourceUploadModal: React.FC<{ onClose: () => void; onUploadSuccess: () => void }> = ({ onClose, onUploadSuccess }) => {
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadCategory, setUploadCategory] = useState('');
    const [uploadType, setUploadType] = useState<'pdf' | 'audio' | 'video' | 'text' | 'tool' | 'guide'>('pdf'); // Expanded types
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadTags, setUploadTags] = useState(''); // New state for tags

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setUploadFile(e.target.files[0]);
      }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setUploading(true);
      setUploadError('');

      if (!uploadFile && uploadType !== 'text' && uploadType !== 'tool' && uploadType !== 'guide') { // File is optional for text/tool/guide types
        setUploadError('Please select a file for this resource type.');
        setUploading(false);
        return;
      }
      if (!uploadTitle || !uploadCategory || !uploadType) {
        setUploadError('Please fill all required fields.');
        setUploading(false);
        return;
      }


  // Removed unused fileUrl variable
      // (Removed /api/upload logic. All uploads now go to /api/resources)

      // Upload resource and file together to /api/resources
      const uploadForm = new FormData();
      uploadForm.append('title', uploadTitle);
      uploadForm.append('description', uploadDescription);
      uploadForm.append('category', uploadCategory);
      uploadForm.append('type', uploadType);
      if (uploadFile) uploadForm.append('file', uploadFile);
      uploadForm.append('tags', JSON.stringify(uploadTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)));

      try {
        console.log('[Upload Debug] Sending form data:', {
          title: uploadTitle,
          category: uploadCategory,
          type: uploadType,
          fileInfo: uploadFile ? {
            name: uploadFile.name,
            type: uploadFile.type,
            size: uploadFile.size
          } : null
        });

        const response = await api.post('/resources', uploadForm, {
          headers: {
            // Don't set Content-Type, let the browser set it with the boundary
            // 'Content-Type': 'multipart/form-data'
          },
        });

        console.log('[Upload Success] Server response:', response.data);
        
        setUploading(false);
        onUploadSuccess();
        onClose();
      } catch (err: any) {
        console.error('[Upload Error]', {
          message: err.message,
          response: err.response?.data
        });
        setUploadError(err.response?.data?.error || 'Failed to upload resource to server.');
        setUploading(false);
      }
    };

    // --- FIXED JSX STRUCTURE ---
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <motion.div initial={{ y: -30 }} animate={{ y: 0 }} exit={{ y: -30 }} className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold">×</button>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Upload New Resource</h2>
          {uploadError && <p className="text-center text-red-500 mb-4">{uploadError}</p>}
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label htmlFor="uploadTitle" className="block text-slate-300 text-sm font-bold mb-2">Title</label>
              <input
                type="text"
                id="uploadTitle"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="uploadDescription" className="block text-slate-300 text-sm font-bold mb-2">Description</label>
              <textarea
                id="uploadDescription"
                rows={3}
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              ></textarea>
            </div>
            <div>
              <label htmlFor="uploadCategory" className="block text-slate-300 text-sm font-bold mb-2">Category</label>
              <select
                id="uploadCategory"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                {categories.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="uploadType" className="block text-slate-300 text-sm font-bold mb-2">Type</label>
              <select
                id="uploadType"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as 'pdf' | 'audio' | 'video' | 'text' | 'tool' | 'guide')}
                required
              >
                <option value="pdf">PDF</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="text">Text</option>
                <option value="tool">Tool</option>
                <option value="guide">Guide</option>
              </select>
            </div>
            {uploadType !== 'text' && uploadType !== 'tool' && uploadType !== 'guide' && (
              <div>
                <label htmlFor="uploadFile" className="block text-slate-300 text-sm font-bold mb-2">File</label>
                <input
                  type="file"
                  id="uploadFile"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={handleFileChange}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="uploadTags" className="block text-slate-300 text-sm font-bold mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                id="uploadTags"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="e.g., stress, anxiety, meditation"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Resource'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Resource Hub
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Curated collection of mental health resources, tools, and guides 
            designed specifically for college students.
          </p>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="resource-search"
                name="resource-search"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-80 bg-slate-800/50 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
            {(user && (user.role === 'admin' || user.role === 'counsellor')) && (
              <motion.button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <UploadCloud className="w-5 h-5" />
                <span>Add Resource</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl border transition-all ${
                activeCategory === category.id
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                  : 'border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300'
              }`}
              whileHover={{ 
                scale: 1.05,
                boxShadow: activeCategory === category.id 
                  ? "0 0 20px rgba(6, 182, 212, 0.4)"
                  : "0 0 10px rgba(6, 182, 212, 0.2)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <category.icon className="w-4 h-4" />
              <span className="font-medium">{category.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Resource Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin w-10 h-10 text-cyan-400" />
            <p className="ml-4 text-lg text-gray-300">Loading resources...</p>
          </div>
        ) : error ? (
          <p className="text-center text-red-400 text-lg">{error}</p>
        ) : filteredResources.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No resources found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            <motion.button
              onClick={() => {
                setSearchTerm('');
                setActiveCategory('all');
              }}
              className="mt-4 px-6 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-400/30 hover:bg-cyan-500/30 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Reset Filters
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            layout
          >
            <AnimatePresence>
              {filteredResources.map((resource) => (
                <motion.div
                  key={resource._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -10 }}
                  className="group relative overflow-hidden"
                >
                  <motion.div
                    className={`p-6 h-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl hover:border-cyan-400/40 transition-all duration-300 cursor-pointer`}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      // If the click came from a button inside the card, do not trigger the expand/collapse
                      if ((e.target as HTMLElement).closest('button')) {
                        return;
                      }
                      setExpandedCard(expandedCard === resource._id ? null : resource._id);
                    }}
                    whileHover={{ 
                      boxShadow: "0 20px 40px rgba(6, 182, 212, 0.2)"
                    }}
                  >
                    {/* Resource Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                        {/* Display an icon based on resource type or a generic thumbnail */}
                        {resource.type === 'video' && <Play className="w-10 h-10 text-cyan-400" />}
                        {resource.type === 'audio' && <Headphones className="w-10 h-10 text-cyan-400" />}
                        {resource.type === 'pdf' && <FileText className="w-10 h-10 text-cyan-400" />}
                        {resource.type === 'text' && <BookOpen className="w-10 h-10 text-cyan-400" />}
                        {resource.type === 'tool' && <Zap className="w-10 h-10 text-cyan-400" />}
                        {resource.type === 'guide' && <BookOpen className="w-10 h-10 text-cyan-400" />}
                        {!resource.type && <BookOpen className="w-10 h-10 text-cyan-400" />}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-yellow-400 mb-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs font-medium">{resource.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-400 text-xs">
                          <Download className="w-3 h-3" />
                          <span>{resource.downloads?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      {resource.title}
                    </h3>
                    {resource.user_id && (
                      <p className="text-gray-400 text-xs mb-2">Added by: {resource.user_id.name}</p>
                    )}
                    
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed group-hover:text-gray-300 transition-colors">
                      {resource.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1 text-cyan-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{resource.duration || 'N/A'}</span>
                      </div>
                      <div className={`px-3 py-1 bg-gradient-to-r ${resource.color || 'from-cyan-500 to-blue-500'} bg-opacity-20 text-white text-xs rounded-full border border-current border-opacity-30`}>
                        {resource.category.toUpperCase()}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.tags && resource.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-md border border-cyan-400/30"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Button */}
                    {resource.file_url ? (
                      <AccessResource
                        url={resource.file_url}
                        filename={resource.title}
                        resourceId={resource._id}
                      />
                    ) : (
                      <motion.button
                        className={`w-full py-3 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-xl font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-not-allowed`}
                        disabled
                      >
                        No File Available
                      </motion.button>
                    )}

                    {/* Glow effect */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${resource.color || 'from-cyan-500 to-blue-500'} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}
                      initial={false}
                    />
                  </motion.div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedCard === resource._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 bg-slate-800/30 border border-cyan-400/30 rounded-xl"
                      >
                        <h4 className="text-cyan-400 font-medium mb-2">Resource Details</h4>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Scientifically backed techniques</li>
                          <li>• Created by licensed professionals</li>
                          <li>• Updated regularly based on student feedback</li>
                          <li>• Available offline after download</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showUploadModal && <ResourceUploadModal onClose={() => setShowUploadModal(false)} onUploadSuccess={fetchResources} />}
      </AnimatePresence>
    </div>
  );
};

export default ResourceHub;