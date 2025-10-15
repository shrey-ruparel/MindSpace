import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { AuthResponse } from '../services/api';
import { AxiosResponse } from 'axios';

interface AuthProps {
  onClose: () => void;
  onAuthSuccess: (authData: AuthResponse) => void; // Changed to AuthResponse
  addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
}

const Auth: React.FC<AuthProps> = ({ onClose, onAuthSuccess, addNotification }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'counsellor' | 'admin'>('student'); // Explicitly define role type
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState('');
  // const [registeredUserId, setRegisteredUserId] = useState<string | null>(null); // Removed unused

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res: AxiosResponse<AuthResponse>;
      if (isLogin) {
        res = await api.post<AuthResponse>('/auth/login', { email, password });
        if (res.data.otpRequiredForLogin) {
          // setRegisteredUserId(res.data.userId || null); // removed unused
          setShowOtpForm(true);
          // It's important to set the email here for OTP verification, 
          // as the user might not have typed it into the OTP form yet.
          setEmail(email);
          addNotification(res.data.msg || 'OTP sent to your email. Please verify to log in.', 'info');
          return; // Exit here, don't proceed to login flow
        }
      } else {
        const registrationRes = await api.post<AuthResponse>('/auth/register', { name, email, password, role });
        if (role === 'admin' || role === 'counsellor') {
          // setRegisteredUserId(registrationRes.data.userId || null); // removed unused
          setShowOtpForm(true);
          addNotification(registrationRes.data.msg || 'Registration successful. Please check your email for OTP.', 'info');
          return; // Exit here, don't proceed to login flow
        } else {
          // For student roles, proceed with direct login/auth success
          res = registrationRes;
        }
      }

  localStorage.setItem('accessToken', res.data.accessToken ? String(res.data.accessToken) : ''); // Store accessToken
  localStorage.setItem('refreshToken', res.data.refreshToken ? String(res.data.refreshToken) : ''); // Store refreshToken
      onAuthSuccess(res.data); // Pass the full AuthResponse

    } catch (err: any) {
      console.error('Auth error:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Authentication failed');
      addNotification(err.response?.data?.msg || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post<AuthResponse>('/auth/verify-otp', { email, otp });
  localStorage.setItem('accessToken', res.data.accessToken ? String(res.data.accessToken) : ''); // Store accessToken
  localStorage.setItem('refreshToken', res.data.refreshToken ? String(res.data.refreshToken) : ''); // Store refreshToken
      onAuthSuccess(res.data); // Pass the full AuthResponse with tokens and user
      onClose(); // Close the modal after successful OTP verification and authentication
    } catch (err: any) {
      console.error('OTP verification error:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'OTP verification failed');
      addNotification(err.response?.data?.msg || 'OTP verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
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
            &times;
          </button>
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            {isLogin ? 'Login' : 'Register'}
          </h2>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          {showOtpForm ? (
            <form onSubmit={handleOtpVerification} className="space-y-4">
              <p className="text-center text-slate-300">An OTP has been sent to your email address ({email}). Please enter it below to verify your account.</p>
              <div>
                <label htmlFor="otp" className="block text-slate-300 text-sm font-bold mb-2">OTP</label>
                <input
                  type="text"
                  id="otp"
                  className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-slate-300 text-sm font-bold mb-2">Name</label>
                  <input
                    type="text"
                    id="name"
                    className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}
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
              <div className="relative flex flex-col">
                <label htmlFor="password" className="block text-slate-300 text-sm font-bold mb-2">Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 text-slate-400 hover:text-white focus:outline-none p-1 flex items-center h-full"
                    style={{ top: '50%', transform: 'translateY(-50%)', height: 'auto' }}
                    tabIndex={-1}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.234.938-4.675M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.062-4.675A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10-.657 0-1.299-.064-1.925-.187M4.222 4.222l15.556 15.556" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7-2c-1.657-4-6-7-10-7S3.657 6 2 10c1.657 4 6 7 10 7s8.343-3 10-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {!isLogin && (
                <div>
                  <label htmlFor="role" className="block text-slate-300 text-sm font-bold mb-2">Role</label>
                  <select
                    id="role"
                    className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'student' | 'counsellor' | 'admin')}
                  >
                    <option value="student">Student</option>
                    <option value="counsellor">Counsellor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
              </button>
            </form>
          )}

          <p className="text-center text-slate-400 text-sm mt-6">
            {isLogin ? "Don't have an account?" : (showOtpForm ? "Resend OTP?" : "Already have an account?")}
            <button
              onClick={() => { if (!showOtpForm) setIsLogin(!isLogin); else { /* resend OTP logic here */ addNotification('Resending OTP (not implemented yet)', 'info'); } }}
              className="text-blue-500 hover:text-blue-400 font-bold ml-1 focus:outline-none"
            >
              {isLogin ? 'Register' : (showOtpForm ? 'Resend' : 'Login')}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Auth;
