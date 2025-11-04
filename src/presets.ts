import type { Algorithm } from './types.ts'

export const fixedWindow = (limit: number, window: number): Algorithm => ({
  type: 'fixed-window',
  limit,
  window,
})

export const slidingWindow = (limit: number, window: number): Algorithm => ({
  type: 'sliding-window',
  limit,
  window,
})

export const tokenBucket = (limit: number, window: number, refillRate?: number): Algorithm => ({
  type: 'token-bucket',
  limit,
  window,
  refillRate,
})
