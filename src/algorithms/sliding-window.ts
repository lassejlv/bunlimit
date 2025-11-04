import type { RedisClient } from 'bun'
import type { RatelimitResponse } from '../types.ts'

export async function slidingWindow(redis: RedisClient, key: string, limit: number, window: number): Promise<RatelimitResponse> {
  const now = Date.now()
  const windowMs = window * 1000
  const currentWindow = Math.floor(now / windowMs)
  const previousWindow = currentWindow - 1

  const currentKey = `${key}:${currentWindow}`
  const previousKey = `${key}:${previousWindow}`

  const [currentCount, previousCount] = await Promise.all([redis.incr(currentKey), redis.get(previousKey).then((val) => (val ? parseInt(val, 10) : 0))])

  if (currentCount === 1) {
    await redis.expire(currentKey, window * 2)
  }

  const percentageInCurrent = (now % windowMs) / windowMs
  const weightedCount = previousCount * (1 - percentageInCurrent) + currentCount

  const success = weightedCount <= limit
  const remaining = Math.max(0, Math.floor(limit - weightedCount))
  const reset = (currentWindow + 1) * windowMs

  return {
    success,
    limit,
    remaining,
    reset,
    pending: Promise.resolve(),
  }
}
