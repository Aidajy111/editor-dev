import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({
  baseURL: '', // благодаря vite proxy
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
