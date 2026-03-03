import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔁 Handle expired access token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(
          `${API_BASE_URL}/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccess = res.data.access;
        const newRefresh = res.data.refresh;

        localStorage.setItem("access_token", newAccess);
        if (newRefresh) {
          localStorage.setItem("refresh_token", newRefresh);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);

      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const askAI = async (question) => {
  const res = await api.post("/ai/chat", { question });
  return res.data;
};

export default api;
