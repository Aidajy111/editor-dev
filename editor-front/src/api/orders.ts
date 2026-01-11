import { api } from './client'
import type { OrderCreateResponse } from '../types/order'

export async function createOrderMultipart(formData: FormData) {
  const res = await api.post<OrderCreateResponse>('/api/orders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
