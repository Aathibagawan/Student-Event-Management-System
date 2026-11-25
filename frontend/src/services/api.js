import axios from "axios";
import { tokenStorage } from "../utils/tokenStorage";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL: API_URL });

// 1) Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 2) If the access token expired (401), use the refresh token once, then retry the request.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");
    if (error.response?.status === 401 && !original._retry && !isAuthCall && tokenStorage.getRefresh()) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${API_URL}/auth/refresh/`, { refresh: tokenStorage.getRefresh() }).finally(() => {
            refreshing = null;
          });
        const { data } = await refreshing;
        tokenStorage.save({ access: data.access, refresh: data.refresh });
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        tokenStorage.clear();
        window.dispatchEvent(new Event("ace:logout"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
