import type { RedisClient } from 'bun'

export interface RatelimitConfig {
  redis: RedisClient
  limiter: Algorithm
  prefix?: string
  analytics?: boolean
}

export interface Algorithm {
  type: 'fixed-window' | 'sliding-window' | 'token-bucket'
  limit: number
  window: number
  refillRate?: number
}

export interface RatelimitResponse {
  success: boolean
  limit: number
  remaining: number
  reset: number
  pending: Promise<unknown>
}

export interface MultiRatelimitResponse {
  identifier: string
  success: boolean
  limit: number
  remaining: number
  reset: number
}
