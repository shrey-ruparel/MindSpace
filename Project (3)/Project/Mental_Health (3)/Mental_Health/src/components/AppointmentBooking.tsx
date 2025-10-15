import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Star, MapPin, Phone, Video, Loader, X } from 'lucide-react';
import api, { UserResponse } from '../services/api';

interface AppointmentBookingProps {
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  user: UserResponse | null;
}

interface Counselor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  rating: number;
  experience: string;
  nextAvailable?: string; // This would ideally be dynamic from backend
  profile_picture?: string; // Or a profile_picture URL
}

interface Appointment {
  _id: string;
  counsellor_id: Counselor;
  datetime: string;
  status: string;
  anonymous: boolean;
  suggested_datetime?: string; // Optional field for rejected appointments
  cancellation_remark?: string; // Optional field for cancellation remark
  meetLink?: string;
  chatHistoryAccessStatus?: 'none' | 'pending' | 'approved' | 'denied';
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ addNotification, user }) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedCounselorId, setSelectedCounselorId] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  // State for cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancellationRemark, setCancellationRemark] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [counsellorsRes, appointmentsRes] = await Promise.all([
        api.get('/appointments/counsellors'),
        api.get('/appointments')
      ]);
      setCounselors(counsellorsRes.data.map((c: any) => ({ ...c, id: c._id })));
      setBookedAppointments(appointmentsRes.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.msg || 'Failed to fetch data');
      addNotification('Failed to load appointment data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, addNotification]);

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM'
  ];

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        isToday: i === 0,
        isTomorrow: i === 1
      });
    }
    return dates;
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedCounselorId) {
      addNotification('Please select date, time, and counselor', 'error');
      return;
    }

    setBookingLoading(true);
    try {
      const dateTimeString = `${selectedDate}T${convertTimeTo24Hour(selectedTime)}:00`;
      const response = await api.post('/appointments', {
        counsellor_id: selectedCounselorId,
        datetime: new Date(dateTimeString).toISOString(),
        anonymous: false // Assuming non-anonymous for now
      });

      setBookedAppointments(prev => [...prev, response.data]);
      addNotification(
        `Appointment booked with ${counselors.find(c => c._id === selectedCounselorId)?.name} on ${selectedDate} at ${selectedTime}`,
        'success'
      );
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setSelectedCounselorId('');
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      setError(err.response?.data?.msg || 'Failed to book appointment');
      addNotification(err.response?.data?.msg || 'Failed to book appointment', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const convertTimeTo24Hour = (time: string): string => {
    const [hourMin, ampm] = time.split(' ');
    let [hours, minutes] = hourMin.split(':');
    if (ampm === 'PM' && hours !== '12') {
      hours = String(parseInt(hours, 10) + 12);
    }
    if (ampm === 'AM' && hours === '12') {
      hours = '00';
    }
    return `${hours}:${minutes}`;
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;

    setCancelling(true); // Using cancelling state for deletion too for simplicity
    try {
      await api.delete(`/appointments/${appointmentToDelete._id}`);

      addNotification('Appointment deleted successfully.', 'success');
      setShowConfirmDeleteModal(false); // Close the confirmation modal
      setAppointmentToDelete(null);
      fetchData(); // Re-fetch appointments to update the list
    } catch (err: any) {
      console.error('Error deleting appointment:', err);
      addNotification(err.response?.data?.msg || 'Failed to delete appointment.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setShowConfirmCancelModal(true); // Show the new confirmation modal
    setCancellationRemark(''); // Clear previous remark
  };

  const handleConfirmCancellation = async () => {
    if (!appointmentToCancel) return;

    setCancelling(true);
    try {
      await api.put(`/appointments/${appointmentToCancel._id}/status`, {
        status: 'cancelled',
        cancellation_remark: 'Cancelled by student' // Default remark for direct cancellation
      });

      addNotification('Appointment cancelled successfully.', 'success');
      setShowConfirmCancelModal(false); // Close the confirmation modal
      setAppointmentToCancel(null);
      fetchData(); // Re-fetch appointments to update the list
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      addNotification(err.response?.data?.msg || 'Failed to cancel appointment.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleRespondChatHistoryAccess = async (appointmentId: string, action: 'approve' | 'deny') => {
    try {
      const res = await api.post(`/appointments/${appointmentId}/respond-chat-history-access-in-app`, { action });
      addNotification(res.data.msg || `Chat history access ${action === 'approve' ? 'approved' : 'denied'} successfully.`, 'success');
      fetchData(); // Re-fetch to update the list
    } catch (err: any) {
      console.error(`Error responding to chat history access (${action}):`, err);
      addNotification(err.response?.data?.msg || `Failed to ${action} chat history access.`, 'error');
    }
  };

  if (!user) {
    return (
      <div className="pt-16 min-h-screen px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <p className="text-xl text-gray-300">Please log in to book appointments.</p>
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
            Book Your Session
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Connect with professional counselors who understand student life. 
            All sessions are completely confidential and stigma-free.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin w-10 h-10 text-cyan-400" />
            <p className="ml-4 text-lg text-gray-300">Loading counsellors and appointments...</p>
          </div>
        ) : error ? (
          <p className="text-center text-red-400 text-lg">{error}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Counselor Selection */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <User className="w-6 h-6 text-cyan-400 mr-2" />
                Choose Your Counselor
              </h2>
              
              <div className="grid gap-6">
                {counselors.length === 0 ? (
                  <p className="text-gray-400">No counsellors available at the moment.</p>
                ) : (
                  counselors.map((counselor) => (
                    <motion.div
                      key={counselor._id}
                      onClick={() => setSelectedCounselorId(counselor._id)}
                      className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${
                        selectedCounselorId === counselor._id
                          ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20'
                          : 'border-cyan-500/20 bg-slate-800/50 hover:border-cyan-400/40 hover:bg-slate-800/70'
                      }`}
                      whileHover={{ 
                        scale: 1.02,
                        boxShadow: "0 10px 30px rgba(6, 182, 212, 0.2)"
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start space-x-4">
                        {counselor.profile_picture ? (
                          <img src={counselor.profile_picture} alt={counselor.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-gray-400" /> // Fallback to User icon
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold text-white">{counselor.name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-yellow-400 font-medium">{counselor.rating || 'N/A'}</span>
                            </div>
                          </div>
                          <p className="text-cyan-300 mb-2">{counselor.specialization}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{counselor.experience || 'N/A'} experience</span>
                            <span>•</span>
                            <span className="text-green-400">Next available: {counselor.nextAvailable || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Booking Panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Appointment Type */}
              <div className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Video className="w-5 h-5 text-cyan-400 mr-2" />
                  Session Type
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'video' as const, icon: Video, label: 'Video' },
                    { type: 'phone' as const, icon: Phone, label: 'Phone' },
                    { type: 'in-person' as const, icon: MapPin, label: 'In-Person' }
                  ].map(({ type, icon: Icon, label }) => (
                    <motion.button
                      key={type}
                      onClick={() => setAppointmentType(type)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        appointmentType === type
                          ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                          : 'border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" />
                      <div className="text-xs font-medium">{label}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 text-cyan-400 mr-2" />
                  Select Date
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {generateDates().map((date) => (
                    <motion.button
                      key={date.value}
                      onClick={() => setSelectedDate(date.value)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedDate === date.value
                          ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                          : 'border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300'
                      } ${date.isToday ? 'ring-2 ring-yellow-400/50' : ''}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-sm font-medium">{date.display}</div>
                      {date.isToday && <div className="text-xs text-yellow-400">Today</div>}
                      {date.isTomorrow && <div className="text-xs text-green-400">Tomorrow</div>}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div className="p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-cyan-400 mr-2" />
                  Select Time
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {timeSlots.map((time) => (
                    <motion.button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        selectedTime === time
                          ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                          : 'border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-sm font-medium">{time}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Book Button */}
              <motion.button
                onClick={handleBookAppointment}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 0 30px rgba(6, 182, 212, 0.5)"
                }}
                whileTap={{ scale: 0.98 }}
                disabled={!selectedDate || !selectedTime || !selectedCounselorId || bookingLoading}
              >
                {bookingLoading ? 'Booking...' : 'Book Appointment'}
              </motion.button>
            </motion.div>
          </div>
        )}

        {/* My Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-6 bg-slate-800/50 border border-cyan-500/20 rounded-2xl"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <Calendar className="w-6 h-6 text-purple-400 mr-2" />
            My Appointments
          </h2>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="animate-spin w-8 h-8 text-purple-400" />
              <p className="ml-4 text-gray-300">Loading your appointments...</p>
            </div>
          ) : bookedAppointments.length === 0 ? (
            <p className="text-gray-400">You have no upcoming appointments.</p>
          ) : (
            <div className="grid gap-4">
              {bookedAppointments.map((appointment) => (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-slate-700/30 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium">Counselor: {appointment.counsellor_id.name}</p>
                    <p className="text-gray-400 text-sm">Date: {new Date(appointment.datetime).toLocaleDateString()}</p>
                    <p className="text-gray-400 text-sm">Time: {new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    {appointment.meetLink && (
                        <a
                            href={appointment.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                        >
                            <Video className="-ml-0.5 mr-2 h-4 w-4" />
                            Join Meet
                        </a>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      appointment.status === 'approved' || appointment.status === 'scheduled' ? 'bg-green-500/20 text-green-300' :
                      appointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                      appointment.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300' // Default for 'completed' or unknown
                    }`}>
                      {appointment.status}
                    </span>
                    {appointment.status === 'rejected' && appointment.suggested_datetime && (
                      <p className="text-sm text-red-400 mt-1">Suggested: {new Date(appointment.suggested_datetime).toLocaleString()}</p>
                    )}

                    {appointment.chatHistoryAccessStatus === 'pending' && (
                      <div className="flex mt-2 space-x-2">
                        <motion.button
                          onClick={() => handleRespondChatHistoryAccess(appointment._id, 'approve')}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Accept Chat History
                        </motion.button>
                        <motion.button
                          onClick={() => handleRespondChatHistoryAccess(appointment._id, 'deny')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Reject Chat History
                        </motion.button>
                      </div>
                    )}

                    {(appointment.status === 'pending' || appointment.status === 'approved' || appointment.status === 'scheduled') && (
                      <motion.button
                        onClick={() => handleCancelClick(appointment)}
                        className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancel
                      </motion.button>
                    )}

                    {appointment.status === 'cancelled' && (
                      <motion.button
                        onClick={() => { setAppointmentToDelete(appointment); setShowConfirmDeleteModal(true); }}
                        className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Delete Request
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* New Confirmation Cancel Modal */}
        <AnimatePresence>
          {showConfirmCancelModal && appointmentToCancel && (
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
                  onClick={() => setShowConfirmCancelModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Confirm Cancellation</h2>
                <p className="text-gray-300 mb-6 text-center">
                  Do you want to cancel your appointment with 
                  <span className="font-semibold"> {appointmentToCancel.counsellor_id.name}</span> on 
                  <span className="font-semibold"> {new Date(appointmentToCancel.datetime).toLocaleDateString()} at 
                  {new Date(appointmentToCancel.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>?
                </p>
                <div className="flex justify-center space-x-4">
                  <motion.button
                    onClick={handleConfirmCancellation}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                    disabled={cancelling}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowConfirmCancelModal(false)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    No
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Confirmation Delete Modal */}
        <AnimatePresence>
          {showConfirmDeleteModal && appointmentToDelete && (
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
                  onClick={() => setShowConfirmDeleteModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Confirm Deletion</h2>
                <p className="text-gray-300 mb-6 text-center">
                  Do you want to delete your cancelled appointment with 
                  <span className="font-semibold"> {appointmentToDelete.counsellor_id.name}</span> on 
                  <span className="font-semibold"> {new Date(appointmentToDelete.datetime).toLocaleDateString()} at 
                  {new Date(appointmentToDelete.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>?
                </p>
                <div className="flex justify-center space-x-4">
                  <motion.button
                    onClick={handleDeleteAppointment}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                    disabled={cancelling}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {cancelling ? 'Deleting...' : 'Yes, Delete'}
                  </motion.button>
                  <motion.button
                    onClick={() => setShowConfirmDeleteModal(false)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    No
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Original Cancellation Modal (Removed) */}
      </div>
    </div>
  );
};

export default AppointmentBooking;