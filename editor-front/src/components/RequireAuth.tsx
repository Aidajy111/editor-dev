import type { JSX } from 'react' 
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}