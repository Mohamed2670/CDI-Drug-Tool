import axios from 'axios';

const API_BASE_URL ="http://localhost:5062"

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
});

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies (refresh token)
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  config => {
    const authHeader = getAuthHeader();
    Object.entries(authHeader).forEach(([key, value]) => {
      config.headers?.set(key, value);
    });
    return config;
  },
  error => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Token expired, refreshing...');
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        interface TokenResponse {
          accessToken: string;
        }
        const res = await axios.post<TokenResponse>(
          `${API_BASE_URL}/user/access-token`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        processQueue(null, newToken);

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;