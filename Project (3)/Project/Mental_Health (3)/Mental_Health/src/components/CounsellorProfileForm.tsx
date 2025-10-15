import React, { useState, useEffect } from 'react';
import api, { UserResponse } from '../services/api';
import { motion } from 'framer-motion';

interface CounsellorProfileFormProps {
  user: UserResponse | null;
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  onProfileUpdated: () => void;
}

const CounsellorProfileForm: React.FC<CounsellorProfileFormProps> = ({ user, addNotification, onProfileUpdated }) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [specialization, setSpecialization] = useState('');
  const [availability, setAvailability] = useState('');
  const [contact, setContact] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [existingProfilePicture, setExistingProfilePicture] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [counsellorStatus, setCounsellorStatus] = useState<string | null>(null); // New state for counsellor status

  useEffect(() => {
    if (user?.role === 'counsellor' && user?._id) {
      // Fetch existing counsellor details if available
      const fetchCounsellorDetails = async () => {
        try {
          const response = await api.get(`/counsellors/${user._id}`);
          const counsellorData = response.data;
          setName(counsellorData.name);
          setEmail(counsellorData.email);
          setSpecialization(counsellorData.specialization || '');
          setAvailability(counsellorData.availability || '');
          setContact(counsellorData.contact || '');
          setBio(counsellorData.bio || '');
          setExistingProfilePicture(counsellorData.profile_picture || '');
          setCounsellorStatus(counsellorData.status); // Set counsellor status
          setIsEditMode(true); // If data exists, it's an edit
        } catch (error) {
          console.error('Failed to fetch counsellor details:', error);
          // If no details found, it's a new profile
          setIsEditMode(false);
        }
      };
      fetchCounsellorDetails();
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('specialization', specialization);
    formData.append('availability', availability);
    formData.append('contact', contact);
    formData.append('bio', bio);
    if (profilePicture) {
      formData.append('profile_picture', profilePicture);
    }

    try {
      if (isEditMode) {
        await api.put(`/counsellors/${user?._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addNotification('Counsellor profile updated successfully!', 'success');
      } else {
        await api.post('/counsellors/request-approval', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addNotification('You successfully applied for the counsellor', 'success');
      }
      onProfileUpdated();
    } catch (error) {
      console.error('Failed to save counsellor profile:', error);
      addNotification('Failed to save counsellor profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'counsellor') {
    return <p className="text-center text-red-500">You must be a counsellor to access this page.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-8 bg-gray-800 rounded-lg shadow-lg my-8"
    >
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        {isEditMode ? 'Edit Your Counsellor Profile' : 'Complete Your Counsellor Profile'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
          <input
            type="text"
            id="name"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input
            type="email"
            id="email"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled
          />
        </div>
        <div>
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-300 mb-1">Specialization</label>
          <input
            type="text"
            id="specialization"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g., CBT, Trauma, Anxiety"
            required
          />
        </div>
        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-300 mb-1">Availability</label>
          <input
            type="text"
            id="availability"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="e.g., Mon-Fri 9-5 PM"
          />
        </div>
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-300 mb-1">Contact Number</label>
          <input
            type="text"
            id="contact"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g., +1 (123) 456-7890"
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
          <textarea
            id="bio"
            rows={5}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself and your approach to counselling."
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-300 mb-1">Profile Picture</label>
          <input
            type="file"
            id="profilePicture"
            accept="image/*"
            className="block w-full text-sm text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
            onChange={handleFileChange}
          />
          {existingProfilePicture && (
            <div className="mt-4">
              <p className="text-gray-400">Current Profile Picture:</p>
              <img src={existingProfilePicture} alt="Profile" className="mt-2 w-32 h-32 object-cover rounded-full" />
            </div>
          )}
        </div>
        
        {counsellorStatus === 'pending' && (
          <div className="bg-yellow-500/20 text-yellow-300 p-4 rounded-md mb-4 text-center">
            Your counsellor profile is currently pending approval by an administrator. You cannot submit new requests.
          </div>
        )}

        <motion.button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 px-4 rounded-md hover:from-blue-600 hover:to-cyan-600 transition duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading || (isEditMode && counsellorStatus === 'pending')}
        >
          {loading ? 'Saving...' : (isEditMode ? 'Update Profile' : 'Submit for Approval')}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default CounsellorProfileForm;
