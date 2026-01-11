import type { CartItem } from '../types/cart'

export type CheckoutForm = {
  name: string
  email: string
  phone: string
  comment?: string
}

export type OrderCreateRequest = {
  customer: CheckoutForm
  items: CartItem[]
}

export type OrderCreateResponse = {
  orderId: string
}
