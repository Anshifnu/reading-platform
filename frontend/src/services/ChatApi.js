import axios from "axios";

const chatApi = axios.create({
  baseURL: "http://localhost/api/chat/",
});

// Attach JWT (same token, different service)
chatApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default chatApi;
