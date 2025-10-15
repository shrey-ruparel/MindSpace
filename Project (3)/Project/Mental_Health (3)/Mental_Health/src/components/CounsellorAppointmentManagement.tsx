import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, Ban, X, Info, Loader, Video, MessageCircle } from 'lucide-react';
import api, { UserResponse } from '../services/api';
import { Counsellor } from './CounsellorManagement'; // Import the Counsellor interface

interface Appointment {
  _id: string;
  student_id: {
    _id: string;
    name: string;
    anonymous_flag: boolean;
  };
  counsellor_id: string; // Counsellor ID, not the full object here
  datetime: string;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'completed' | 'cancelled';
  anonymous: boolean;
  suggested_datetime?: string;
  meetLink?: string; // Added for meeting link
  chatHistoryAccessStatus?: 'none' | 'pending' | 'approved' | 'denied';
  chatHistoryAccessRequestedAt?: string;
  chatHistoryAccessRespondedAt?: string;
  chatHistoryAccessToken?: string;
  chatHistoryAccessTokenExpires?: string;
}

interface CounsellorAppointmentManagementProps {
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  user: UserResponse | null;
}

const CounsellorAppointmentManagement: React.FC<CounsellorAppointmentManagementProps> = ({ addNotification, user }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [suggestedDateTime, setSuggestedDateTime] = useState<string>('');
  const [rejecting, setRejecting] = useState(false);
  const [counsellorStatus, setCounsellorStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null); // State for counsellor's status
  const [isCounsellorProfileLoading, setIsCounsellorProfileLoading] = useState(true);
  const [showChatHistoryModal, setShowChatHistoryModal] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [fetchingChatHistory, setFetchingChatHistory] = useState(false);
  const [selectedStudentForChat, setSelectedStudentForChat] = useState<{ _id: string; name: string } | null>(null);
  const [requestingChatHistoryAccess, setRequestingChatHistoryAccess] = useState<boolean>(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments'); // This now fetches counsellor's appointments
      setAppointments(res.data);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.msg || 'Failed to fetch appointments');
      addNotification('Failed to load appointments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChatHistoryAccess = async (appointmentId: string) => {
    setRequestingChatHistoryAccess(true);
    try {
      const res = await api.post(`/appointments/${appointmentId}/request-chat-history-access`);
      addNotification(res.data.msg, 'success');
      // Optimistically update the appointment status in the UI
      setAppointments(prevApps =>
        prevApps.map(app =>
          app._id === appointmentId ? { ...app, chatHistoryAccessStatus: 'pending' } : app
        )
      );
    } catch (err: any) {
      console.error('Error requesting chat history access:', err);
      addNotification(err.response?.data?.msg || 'Failed to request chat history access', 'error');
    } finally {
      setRequestingChatHistoryAccess(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'counsellor') {
      const fetchCounsellorStatus = async () => {
        try {
          setIsCounsellorProfileLoading(true);
          const res = await api.get(`/counsellors/${user._id}`);
          setCounsellorStatus(res.data.status);
        } catch (err: any) {
          console.error('Error fetching counsellor status:', err);
          addNotification(err.response?.data?.msg || 'Failed to fetch counsellor status.', 'error');
          setCounsellorStatus('rejected'); // Assume rejected if status cannot be fetched
        } finally {
          setIsCounsellorProfileLoading(false);
        }
      };
      fetchCounsellorStatus();
    } else if (user) {
      addNotification('You are not authorized to view this page.', 'error');
    }
  }, [user, addNotification]);
  
  useEffect(() => {
    if (user && user.role === 'counsellor' && counsellorStatus === 'approved') {
      fetchAppointments();
    }
  }, [user, counsellorStatus, addNotification]);

  const handleStatusUpdate = async (appointmentId: string, status: 'approved' | 'rejected', s_datetime?: string) => {
    try {
      let data: { status: string; suggested_datetime?: string } = { status };
      if (s_datetime) {
        data.suggested_datetime = s_datetime;
      }
      
      await api.put(`/appointments/${appointmentId}/status`, data);
      addNotification(`Appointment ${status} successfully`, 'success');
      fetchAppointments(); // Re-fetch to update the list
    } catch (err: any) {
      console.error(`Error updating appointment status to ${status}:`, err);
      addNotification(err.response?.data?.msg || `Failed to ${status} appointment`, 'error');
    }
  };

  const handleApprove = (appointment: Appointment) => {
    if (window.confirm(`Are you sure you want to approve this appointment with ${appointment.anonymous ? 'Anonymous Student' : appointment.student_id.name} on ${new Date(appointment.datetime).toLocaleString()}?`)) {
      handleStatusUpdate(appointment._id, 'approved');
    }
  };

  const handleRejectClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSuggestedDateTime(''); // Reset suggested date time
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedAppointment) return;

    setRejecting(true);
    try {
      await handleStatusUpdate(selectedAppointment._id, 'rejected', suggestedDateTime);
      setShowRejectModal(false);
      setSelectedAppointment(null);
      setSuggestedDateTime('');
    } finally {
      setRejecting(false);
    }
  };

  const handleViewChatHistory = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedStudentForChat(appointment.student_id);
    setShowChatHistoryModal(true);
    setFetchingChatHistory(true);
    setChatHistory([]); // Clear previous history

    try {
      const res = await api.get(`/counsellors/chat-history/${appointment.student_id._id}/${appointment._id}`);
      setChatHistory(res.data.history);
    } catch (err: any) {
      console.error('Error fetching chat history:', err);
      addNotification(err.response?.data?.msg || 'Failed to fetch chat history', 'error');
      setChatHistory([]);
    } finally {
      setFetchingChatHistory(false);
    }
  };

  if (!user || user.role !== 'counsellor') {
    return (
      <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <p className="text-xl text-gray-300">You are not authorized to view this page.</p>
      </div>
    );
  }

  if (isCounsellorProfileLoading) {
    return (
      <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <Loader className="animate-spin w-10 h-10 text-cyan-400" />
        <p className="ml-4 text-lg text-gray-300">Loading counsellor profile status...</p>
      </div>
    );
  }

  if (counsellorStatus === 'pending') {
    return (
      <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <div className="bg-red-900/40 border border-red-700 p-8 rounded-lg shadow-xl text-center">
          <p className="text-2xl font-bold text-white mb-4">Waiting for admin approval</p>
          <p className="text-gray-300">Your counsellor profile is currently under review. Once approved, you will be able to manage appointments here.</p>
        </div>
      </div>
    );
  }

  const pendingAppointments = appointments.filter(app => app.status === 'pending');
  const approvedAppointments = appointments.filter(app => app.status === 'approved' || app.status === 'scheduled');
  const rejectedAppointments = appointments.filter(app => app.status === 'rejected');

  return (
    <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Appointment Management
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Review and manage incoming appointment requests from students.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin w-10 h-10 text-purple-400" />
            <p className="ml-4 text-lg text-gray-300">Loading appointments...</p>
          </div>
        ) : error ? (
          <p className="text-center text-red-400 text-lg">{error}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Appointments */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <Clock className="w-6 h-6 text-yellow-400 mr-2" />
                Pending Requests ({pendingAppointments.length})
              </h2>
              {pendingAppointments.length === 0 ? (
                <p className="text-gray-400">No pending appointment requests.</p>
              ) : (
                <div className="grid gap-4">
                  {pendingAppointments.map((appointment) => (
                    <motion.div
                      key={appointment._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-800/50 border border-yellow-500/20 rounded-xl"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <User className="w-5 h-5 text-yellow-400" />
                        <p className="text-white font-medium">
                          {appointment.anonymous ? 'Anonymous Student' : appointment.student_id.name}
                        </p>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        <Calendar className="inline w-4 h-4 mr-2 text-gray-400" />
                        {new Date(appointment.datetime).toLocaleDateString()}
                      </p>
                      <p className="text-gray-300 text-sm mb-4">
                        <Clock className="inline w-4 h-4 mr-2 text-gray-400" />
                        {new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex space-x-3">
                        <motion.button
                          onClick={() => handleApprove(appointment)}
                          className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center justify-center space-x-1"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </motion.button>
                        <motion.button
                          onClick={() => handleRejectClick(appointment)}
                          className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm flex items-center justify-center space-x-1"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Ban className="w-4 h-4" />
                          <span>Reject</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Approved and Scheduled Appointments */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                Approved & Scheduled ({approvedAppointments.length})
              </h2>
              {approvedAppointments.length === 0 ? (
                <p className="text-gray-400">No approved or scheduled appointments.</p>
              ) : (
                <div className="grid gap-4">
                  {approvedAppointments.map((appointment) => (
                    <motion.div
                      key={appointment._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-800/50 border border-green-500/20 rounded-xl"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <User className="w-5 h-5 text-green-400" />
                        <p className="text-white font-medium">
                          {appointment.anonymous ? 'Anonymous Student' : appointment.student_id.name}
                        </p>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        <Calendar className="inline w-4 h-4 mr-2 text-gray-400" />
                        {new Date(appointment.datetime).toLocaleDateString()}
                      </p>
                      <p className="text-gray-300 text-sm">
                        <Clock className="inline w-4 h-4 mr-2 text-gray-400" />
                        {new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {appointment.meetLink && (
                          <a
                              href={appointment.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                          >
                              <Video className="-ml-0.5 mr-2 h-4 w-4" />
                              Join Meet
                          </a>
                      )}
                      {
                        appointment.chatHistoryAccessStatus === 'approved' ? (
                          <motion.button
                            key="view-history"
                            onClick={() => handleViewChatHistory(appointment)}
                            className="mt-2 ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-blue-500 bg-blue-500/20 hover:bg-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <MessageCircle className="-ml-0.5 mr-2 h-4 w-4" />
                            View Chat History
                          </motion.button>
                        ) : appointment.chatHistoryAccessStatus === 'pending' ? (
                          <motion.button
                            key="pending-access"
                            className="mt-2 ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-400 bg-gray-500/20 cursor-not-allowed"
                            disabled
                          >
                            <MessageCircle className="-ml-0.5 mr-2 h-4 w-4" />
                            Access Pending
                          </motion.button>
                        ) : appointment.chatHistoryAccessStatus === 'denied' ? (
                          <motion.button
                            key="access-denied"
                            className="mt-2 ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-red-400 bg-red-500/20 cursor-not-allowed"
                            disabled
                            title="Student has denied access to chat history"
                          >
                            <MessageCircle className="-ml-0.5 mr-2 h-4 w-4" />
                            Access Denied
                          </motion.button>
                        ) : (
                          <motion.button
                            key="request-history"
                            onClick={() => handleRequestChatHistoryAccess(appointment._id)}
                            className="mt-2 ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-purple-500 bg-purple-500/20 hover:bg-purple-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={requestingChatHistoryAccess}
                          >
                            <MessageCircle className="-ml-0.5 mr-2 h-4 w-4" />
                            {requestingChatHistoryAccess ? 'Requesting...' : 'Request Chat History'}
                          </motion.button>
                        )
                      }
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Rejected Appointments (Optional: for counsellor to review) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-6"
        >
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <Ban className="w-6 h-6 text-red-400 mr-2" />
            Rejected Appointments ({rejectedAppointments.length})
          </h2>
          {rejectedAppointments.length === 0 ? (
            <p className="text-gray-400">No rejected appointments.</p>
          ) : (
            <div className="grid gap-4">
              {rejectedAppointments.map((appointment) => (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-slate-800/50 border border-red-500/20 rounded-xl"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="w-5 h-5 text-red-400" />
                    <p className="text-white font-medium">
                      {appointment.anonymous ? 'Anonymous Student' : appointment.student_id.name}
                    </p>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">
                    <Calendar className="inline w-4 h-4 mr-2 text-gray-400" />
                    Original: {new Date(appointment.datetime).toLocaleDateString()} at {new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {appointment.suggested_datetime && (
                    <p className="text-red-300 text-sm">
                      <Info className="inline w-4 h-4 mr-2 text-red-400" />
                      Suggested: {new Date(appointment.suggested_datetime).toLocaleDateString()} at {new Date(appointment.suggested_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>


        {/* Reject Appointment Modal */}
        <AnimatePresence>
          {showRejectModal && selectedAppointment && (
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
                  onClick={() => setShowRejectModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Reject Appointment</h2>
                <p className="text-gray-300 mb-4">
                  Reject appointment with 
                  <span className="font-semibold">
                    {selectedAppointment.anonymous ? 'Anonymous Student' : selectedAppointment.student_id.name}
                  </span>
                  on 
                  <span className="font-semibold">
                    {new Date(selectedAppointment.datetime).toLocaleDateString()} at 
                    {new Date(selectedAppointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>.
                </p>
                <div className="mb-4">
                  <label htmlFor="suggestedDateTime" className="block text-slate-300 text-sm font-bold mb-2">Suggest New Date/Time (Optional)</label>
                  <input
                    type="datetime-local"
                    id="suggestedDateTime"
                    className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={suggestedDateTime}
                    onChange={(e) => setSuggestedDateTime(e.target.value)}
                  />
                </div>
                <motion.button
                  onClick={handleRejectSubmit}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                  disabled={rejecting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Reject'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat History Modal */}
        <AnimatePresence>
          {showChatHistoryModal && selectedAppointment && selectedStudentForChat && (
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
                className="relative bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-2xl border border-slate-700"
              >
                <button
                  onClick={() => setShowChatHistoryModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                  Chat History with {selectedStudentForChat.name}
                </h2>

                {fetchingChatHistory ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader className="animate-spin w-8 h-8 text-blue-400 mr-3" />
                    <p className="text-blue-300">Loading chat history...</p>
                  </div>
                ) : chatHistory.length === 0 ? (
                  <p className="text-center text-gray-400">No chat history found for this student.</p>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {chatHistory.map((chat, index) => (
                      <div key={index} className="flex flex-col">
                        <div className="flex items-baseline space-x-2">
                          <span className="font-bold text-blue-300">User:</span>
                          <p className="text-white">{chat.query}</p>
                        </div>
                        <div className="flex items-baseline space-x-2">
                          <span className="font-bold text-green-300">AI:</span>
                          <p className="text-white">{chat.response}</p>
                        </div>
                        <span className="text-xs text-gray-500 text-right">
                          {new Date(chat.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <motion.button
                    onClick={() => setShowChatHistoryModal(false)}
                    className="px-6 py-2 bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CounsellorAppointmentManagement;
