import type { Model } from './phone'

export type TextEl = {
  id: number
  type: 'text'
  x: number
  y: number
  text: string
  fontSize: number
  fill: string
  rotation: number
}

export type ImageEl = {
  id: number
  type: 'image'
  x: number
  y: number
  assetId: string
  width: number
  height: number
  rotation: number
}

export type CanvasElement = TextEl | ImageEl

export type CartItem = {
  id: string
  model: Model
  elements: CanvasElement[]
  previewAssetId: string
  createdAt: string
}