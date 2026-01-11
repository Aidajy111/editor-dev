import { api } from './client'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string 
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/api/auth/login', data)
  return res.data
}
