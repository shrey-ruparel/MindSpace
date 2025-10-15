import axios from 'axios';

// Define types for authentication and user responses
interface AuthResponse {
  accessToken?: string; // Made optional for OTP registration flow
  refreshToken?: string; // Made optional for OTP registration flow
  user?: UserResponse; // Made optional for OTP registration flow
  msg?: string; // Added for registration success messages
  userId?: string; // Added for returning user ID during registration
  otpRequiredForLogin?: boolean; // Added for indicating OTP is required for login
}

interface UserResponse {
  _id: string;
  role: 'student' | 'counsellor' | 'admin';
  name: string;
  email: string;
  anonymous_flag: boolean;
  profile_picture?: string;
  streak: number;
  badges: string[];
  isVerified?: boolean; // Added for OTP verification status
}

const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // This is important for sending cookies (e.g., httpOnly JWT)
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void; config: any }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(api(prom.config));
        }
    });
    failedQueue = [];
};

// Request interceptor to add JWT token to headers
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and not already refreshing
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject, config: originalRequest });
                });
            }

            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                // No refresh token, force logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/'; // Redirect to home/login page
                return Promise.reject(error);
            }

            try {
                const rs = await api.post<AuthResponse>('/auth/refresh-token', { refreshToken });
                const { accessToken, refreshToken: newRefreshToken, user } = rs.data;

                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                processQueue(null, accessToken); // Process queued requests

                isRefreshing = false;
                return api(originalRequest); // Retry the original request

            } catch (_error: any) {
                processQueue(_error, null); // Reject queued requests
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/'; // Redirect to home/login page
                return Promise.reject(_error);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
export type { AuthResponse, UserResponse };
