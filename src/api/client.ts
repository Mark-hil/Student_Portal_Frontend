/**
 * Axios API client — JWT auto-refresh + typed errors
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';
const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

export const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  r => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    original._retry = true;
    if (isRefreshing) {
      return new Promise(resolve => {
        refreshSubscribers.push(token => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(client(original));
        });
      });
    }

    isRefreshing = true;
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) { localStorage.clear(); window.location.href = '/login'; return Promise.reject(error); }

    try {
      const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
      localStorage.setItem(ACCESS_KEY, data.access);
      onRefreshed(data.access);
      original.headers.Authorization = `Bearer ${data.access}`;
      return client(original);
    } catch {
      localStorage.clear(); window.location.href = '/login'; return Promise.reject(error);
    } finally { isRefreshing = false; }
  }
);

export default client;
