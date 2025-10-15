import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, Edit, Trash2, PlusCircle, X, UploadCloud } from 'lucide-react';
import api from '../services/api';

interface Resource {
  _id: string;
  title: string;
  description?: string;
  category: string;
  type: 'pdf' | 'audio' | 'video' | 'text' | 'tool' | 'guide';
  file_url: string;
  duration?: string;
  rating?: number;
  downloads?: number;
  tags?: string[];
  createdAt: string; // Add createdAt for display
}

interface ResourceManagementProps {
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const ResourceManagement: React.FC<ResourceManagementProps> = ({ addNotification }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/resources');
      setResources(res.data);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      setError(err.response?.data?.message || 'Failed to fetch resources');
      addNotification(err.response?.data?.message || 'Failed to fetch resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await api.delete(`/admin/resources/remove/${id}`);
        addNotification('Resource removed successfully', 'success');
        fetchResources();
      } catch (err: any) {
        console.error('Error deleting resource:', err);
        addNotification(err.response?.data?.message || 'Failed to remove resource', 'error');
      }
    }
  };

  const ResourceModal: React.FC<{ onClose: () => void; onSaveSuccess: () => void }> = ({ onClose, onSaveSuccess }) => {
    const [title, setTitle] = useState(editingResource?.title || '');
    const [description, setDescription] = useState(editingResource?.description || '');
    const [category, setCategory] = useState(editingResource?.category || '');
    const [type, setType] = useState<Resource['type']>(editingResource?.type || 'pdf');
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState(editingResource?.file_url || '');
    const [duration, setDuration] = useState(editingResource?.duration || '');
    const [rating, setRating] = useState(editingResource?.rating?.toString() || '');
    const [downloads, setDownloads] = useState(editingResource?.downloads?.toString() || '');
    const [tags, setTags] = useState(editingResource?.tags?.join(', ') || '');
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setModalError('');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('type', type);
      if (file) {
        formData.append('resource_file', file);
      } else if (fileUrl && editingResource) {
        // If no new file is selected but there was an existing file_url, send it back
        formData.append('file_url', fileUrl);
      }
      formData.append('duration', duration);
      formData.append('rating', rating);
      formData.append('downloads', downloads);
      formData.append('tags', JSON.stringify(tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)));

      try {
        if (editingResource) {
          await api.put(`/admin/resources/edit/${editingResource._id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          addNotification('Resource updated successfully', 'success');
        } else {
          await api.post('/admin/resources/add', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          addNotification('Resource added successfully', 'success');
        }
        onSaveSuccess();
        onClose();
      } catch (err: any) {
        console.error('Error saving resource:', err.response?.data || err.message);
        setModalError(err.response?.data?.message || 'Failed to save resource');
        addNotification(err.response?.data?.message || 'Failed to save resource', 'error');
      } finally {
        setSaving(false);
      }
    };

    const resourceTypes = ['pdf', 'audio', 'video', 'text', 'tool', 'guide'];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4"
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="relative bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-slate-700"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            {editingResource ? 'Edit Resource' : 'Add New Resource'}
          </h2>

          {modalError && <p className="text-red-500 text-center mb-4">{modalError}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-slate-300 text-sm font-bold mb-2">Title</label>
              <input
                type="text"
                id="title"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-slate-300 text-sm font-bold mb-2">Description</label>
              <textarea
                id="description"
                rows={3}
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
            <div>
              <label htmlFor="category" className="block text-slate-300 text-sm font-bold mb-2">Category</label>
              <input
                type="text"
                id="category"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-slate-300 text-sm font-bold mb-2">Type</label>
              <select
                id="type"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={type}
                onChange={(e) => setType(e.target.value as Resource['type'])}
                required
              >
                {resourceTypes.map(rt => (
                  <option key={rt} value={rt}>{rt.charAt(0).toUpperCase() + rt.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="duration" className="block text-slate-300 text-sm font-bold mb-2">Duration (e.g., '15 min read')</label>
              <input
                type="text"
                id="duration"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="rating" className="block text-slate-300 text-sm font-bold mb-2">Rating (0-5)</label>
              <input
                type="number"
                id="rating"
                step="0.1"
                min="0"
                max="5"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="downloads" className="block text-slate-300 text-sm font-bold mb-2">Downloads</label>
              <input
                type="number"
                id="downloads"
                min="0"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={downloads}
                onChange={(e) => setDownloads(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="tags" className="block text-slate-300 text-sm font-bold mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., stress, anxiety, meditation"
              />
            </div>
            <div>
              <label htmlFor="file" className="block text-slate-300 text-sm font-bold mb-2">Resource File (PDF, Audio, Video)</label>
              <input
                type="file"
                id="file"
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                onChange={handleFileChange}
              />
              {editingResource?.file_url && !file && (
                <p className="text-sm text-gray-400 mt-2">Current file: <a href={editingResource.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Current File</a></p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : (editingResource ? 'Update Resource' : 'Add Resource')}
            </button>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Resources Management</h2>
        <motion.button
          onClick={() => { setEditingResource(null); setShowModal(true); }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add New Resource</span>
        </motion.button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader className="animate-spin w-10 h-10 text-cyan-400" />
          <p className="ml-4 text-lg text-gray-300">Loading resources...</p>
        </div>
      ) : error ? (
        <p className="text-center text-red-400 text-lg">{error}</p>
      ) : resources.length === 0 ? (
        <p className="text-center text-gray-400 text-lg">No resources found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-700/30 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-700 text-slate-300 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Title</th>
                <th className="py-3 px-6 text-left">Type</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-left">Upload Date</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white text-sm font-light">
              {resources.map((resource) => (
                <tr key={resource._id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{resource.title}</td>
                  <td className="py-3 px-6 text-left">{resource.type}</td>
                  <td className="py-3 px-6 text-left">{resource.category}</td>
                  <td className="py-3 px-6 text-left">{new Date(resource.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex item-center justify-center space-x-4">
                      <motion.button
                        onClick={() => { setEditingResource(resource); setShowModal(true); }}
                        className="text-blue-400 hover:text-blue-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Edit className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleDelete(resource._id)}
                        className="text-red-400 hover:text-red-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal && <ResourceModal onClose={() => setShowModal(false)} onSaveSuccess={fetchResources} />}
      </AnimatePresence>
    </div>
  );
};

export default ResourceManagement;
