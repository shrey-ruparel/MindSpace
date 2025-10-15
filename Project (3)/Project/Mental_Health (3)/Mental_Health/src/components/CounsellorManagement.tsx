import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, Edit, Trash2, PlusCircle, X, CheckCircle, Ban } from 'lucide-react';
import api from '../services/api';

interface Counsellor {
  _id: string;
  name: string;
  specialization: string;
  availability: string;
  contact: string;
  email: string;
  profile_picture?: string;
  bio?: string;
  status: 'pending' | 'approved' | 'rejected'; // Add status field
}

interface CounsellorManagementProps {
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const CounsellorManagement: React.FC<CounsellorManagementProps> = ({ addNotification }) => {
  const [approvedCounsellors, setApprovedCounsellors] = useState<Counsellor[]>([]);
  const [pendingCounsellors, setPendingCounsellors] = useState<Counsellor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCounsellor, setEditingCounsellor] = useState<Counsellor | null>(null);
  const [viewMode, setViewMode] = useState<'approved' | 'pending'>('approved'); // New state for view mode

  const fetchCounsellors = async () => {
    setLoading(true);
    try {
      const approvedRes = await api.get('/admin/counsellors'); // Assuming this fetches approved counsellors or all
      const pendingRes = await api.get('/admin/counsellors/pending'); // New endpoint
      
      // Filter approved from the main list if needed, or rely on distinct endpoints
      setApprovedCounsellors(approvedRes.data.filter((c: Counsellor) => c.status === 'approved'));
      setPendingCounsellors(pendingRes.data);

    } catch (err: any) {
      console.error('Error fetching counsellors:', err);
      setError(err.response?.data?.message || 'Failed to fetch counsellors');
      addNotification(err.response?.data?.message || 'Failed to fetch counsellors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounsellors();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this counsellor?')) {
      try {
        await api.delete(`/admin/counsellors/remove/${id}`);
        addNotification('Counsellor removed successfully', 'success');
        fetchCounsellors();
      } catch (err: any) {
        console.error('Error deleting counsellor:', err);
        addNotification(err.response?.data?.message || 'Failed to remove counsellor', 'error');
      }
    }
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    if (window.confirm(`Are you sure you want to ${status} this counsellor?`)) {
      try {
        await api.put(`/admin/counsellors/status/${id}`, { status });
        addNotification(`Counsellor ${status} successfully`, 'success');
        fetchCounsellors();
      } catch (err: any) {
        console.error(`Error updating counsellor status to ${status}:`, err);
        addNotification(`Failed to ${status} counsellor`, 'error');
      }
    }
  };

  const CounsellorModal: React.FC<{ onClose: () => void; onSaveSuccess: () => void }> = ({ onClose, onSaveSuccess }) => {
    const [name, setName] = useState(editingCounsellor?.name || '');
    const [specialization, setSpecialization] = useState(editingCounsellor?.specialization || '');
    const [availability, setAvailability] = useState(editingCounsellor?.availability || '');
    const [contact, setContact] = useState(editingCounsellor?.contact || '');
    const [email, setEmail] = useState(editingCounsellor?.email || '');
    const [bio, setBio] = useState(editingCounsellor?.bio || '');
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
    const [profilePictureUrl, setProfilePictureUrl] = useState(editingCounsellor?.profile_picture || ''); // For displaying existing URL
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setProfilePictureFile(e.target.files[0]);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setModalError('');

      const formData = new FormData();
      formData.append('name', name);
      formData.append('specialization', specialization);
      formData.append('availability', availability);
      formData.append('contact', contact);
      formData.append('email', email);
      formData.append('bio', bio);
      if (profilePictureFile) {
        formData.append('profile_picture', profilePictureFile);
      } else if (profilePictureUrl) {
        formData.append('profile_picture', profilePictureUrl); // Send existing URL if no new file
      } else {
        formData.append('profile_picture', ''); // Explicitly send empty if removed
      }
      
      try {
        if (editingCounsellor) {
          await api.put(`/admin/counsellors/edit/${editingCounsellor._id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          addNotification('Counsellor updated successfully', 'success');
        } else {
          // Admin adds, so status is approved
          formData.append('status', 'approved');
          await api.post('/admin/counsellors/add', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          addNotification('Counsellor added successfully', 'success');
        }
        onSaveSuccess();
        onClose();
      } catch (err: any) {
        console.error('Error saving counsellor:', err);
        setModalError(err.response?.data?.message || 'Failed to save counsellor');
        addNotification(err.response?.data?.message || 'Failed to save counsellor', 'error');
      } finally {
        setSaving(false);
      }
    };

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
            {editingCounsellor ? 'Edit Counsellor' : 'Add New Counsellor'}
          </h2>

          {modalError && <p className="text-red-500 text-center mb-4">{modalError}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-slate-300 text-sm font-bold mb-2">Name</label>
              <input
                type="text"
                id="name"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="specialization" className="block text-slate-300 text-sm font-bold mb-2">Specialization</label>
              <input
                type="text"
                id="specialization"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="availability" className="block text-slate-300 text-sm font-bold mb-2">Availability</label>
              <input
                type="text"
                id="availability"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="contact" className="block text-slate-300 text-sm font-bold mb-2">Contact</label>
              <input
                type="text"
                id="contact"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-slate-300 text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-slate-300 text-sm font-bold mb-2">Bio</label>
              <textarea
                id="bio"
                rows={3}
                className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              ></textarea>
            </div>
            <div>
              <label htmlFor="profilePictureFile" className="block text-slate-300 text-sm font-bold mb-2">Profile Picture</label>
              <input
                type="file"
                id="profilePictureFile"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {profilePictureUrl && !profilePictureFile && (
                <div className="mt-2">
                  <p className="text-slate-400 text-xs">Current: <a href={profilePictureUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Image</a></p>
                  <button 
                    type="button" 
                    onClick={() => setProfilePictureUrl('')} 
                    className="text-red-400 hover:text-red-300 text-sm mt-1"
                  >Remove Current Picture</button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : (editingCounsellor ? 'Update Counsellor' : 'Add Counsellor')}
            </button>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">Counsellors Management</h2>
        <motion.button
          onClick={() => { setEditingCounsellor(null); setShowModal(true); }}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add New Counsellor</span>
        </motion.button>
      </div>

      {/* View Mode Tabs */}
      <div className="flex border-b border-slate-700 mb-8">
        <button
          className={`py-2 px-4 -mb-px border-b-2 ${viewMode === 'approved' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'} focus:outline-none`}
          onClick={() => setViewMode('approved')}
        >
          Approved Counsellors ({approvedCounsellors.length})
        </button>
        <button
          className={`py-2 px-4 -mb-px border-b-2 ${viewMode === 'pending' ? 'border-orange-400 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'} focus:outline-none`}
          onClick={() => setViewMode('pending')}
        >
          Pending Requests ({pendingCounsellors.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader className="animate-spin w-10 h-10 text-cyan-400" />
          <p className="ml-4 text-lg text-gray-300">Loading counsellors...</p>
        </div>
      ) : error ? (
        <p className="text-center text-red-400 text-lg">{error}</p>
      ) : (
        <>
          {viewMode === 'approved' && (
            approvedCounsellors.length === 0 ? (
              <p className="text-center text-gray-400 text-lg">No approved counsellors found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-slate-700/30 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-700 text-slate-300 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Name</th>
                      <th className="py-3 px-6 text-left">Specialization</th>
                      <th className="py-3 px-6 text-left">Availability</th>
                      <th className="py-3 px-6 text-left">Contact</th>
                      <th className="py-3 px-6 text-left">Email</th>
                      <th className="py-3 px-6 text-left">Status</th>
                      <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-white text-sm font-light">
                    {approvedCounsellors.map((counsellor) => (
                      <tr key={counsellor._id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="py-3 px-6 text-left whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={counsellor.profile_picture || 'https://via.placeholder.com/40'}
                              alt={counsellor.name}
                              className="w-8 h-8 rounded-full mr-3 object-cover"
                            />
                            <span>{counsellor.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-left">{counsellor.specialization}</td>
                        <td className="py-3 px-6 text-left">{counsellor.availability}</td>
                        <td className="py-3 px-6 text-left">{counsellor.contact}</td>
                        <td className="py-3 px-6 text-left">{counsellor.email}</td>
                        <td className="py-3 px-6 text-left">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${counsellor.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {counsellor.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <div className="flex item-center justify-center space-x-4">
                            <motion.button
                              onClick={() => { setEditingCounsellor(counsellor); setShowModal(true); }}
                              className="text-blue-400 hover:text-blue-300"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(counsellor._id)}
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
            )
          )}

          {viewMode === 'pending' && (
            pendingCounsellors.length === 0 ? (
              <p className="text-center text-gray-400 text-lg">No pending counsellor requests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingCounsellors.map((counsellor) => (
                  <motion.div
                    key={counsellor._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-slate-800 border border-orange-500/20 rounded-xl p-6 shadow-lg flex flex-col items-center text-center"
                  >
                    <img
                      src={counsellor.profile_picture || 'https://via.placeholder.com/100'}
                      alt={counsellor.name}
                      className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-orange-400"
                    />
                    <h3 className="text-xl font-semibold text-white mb-2">{counsellor.name}</h3>
                    <p className="text-orange-400 text-sm mb-1">{counsellor.specialization}</p>
                    <p className="text-gray-400 text-sm mb-4">{counsellor.email}</p>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">{counsellor.bio || 'No bio provided.'}</p>
                    
                    <div className="flex space-x-4 mt-auto">
                      <motion.button
                        onClick={() => handleStatusUpdate(counsellor._id, 'approved')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleStatusUpdate(counsellor._id, 'rejected')}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Ban className="w-4 h-4" />
                        <span>Reject</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </>
      )}

      <AnimatePresence>
        {showModal && <CounsellorModal onClose={() => setShowModal(false)} onSaveSuccess={fetchCounsellors} />}
      </AnimatePresence>
    </div>
  );
};

export default CounsellorManagement;
