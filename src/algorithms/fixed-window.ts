import type { RedisClient } from 'bun'
import type { RatelimitResponse } from '../types.ts'

export async function fixedWindow(redis: RedisClient, key: string, limit: number, window: number): Promise<RatelimitResponse> {
  const now = Date.now()
  const windowStart = Math.floor(now / (window * 1000)) * (window * 1000)
  const windowKey = `${key}:${windowStart}`

  const count = await redis.incr(windowKey)

  if (count === 1) {
    await redis.expire(windowKey, window)
  }

  const success = count <= limit
  const remaining = Math.max(0, limit - count)
  const reset = windowStart + window * 1000

  return {
    success,
    limit,
    remaining,
    reset,
    pending: Promise.resolve(),
  }
}
