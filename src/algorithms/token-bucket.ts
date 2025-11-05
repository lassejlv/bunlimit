import type { RedisAdapter } from '../adapters/types.ts'
import type { RatelimitResponse } from '../types.ts'

export async function tokenBucket(redis: RedisAdapter, key: string, limit: number, window: number, refillRate: number): Promise<RatelimitResponse> {
  const now = Date.now()
  const bucketKey = `${key}:bucket`
  const timestampKey = `${key}:timestamp`

  const [tokensStr, lastRefillStr] = await Promise.all([redis.get(bucketKey), redis.get(timestampKey)])

  let tokens = tokensStr ? parseFloat(tokensStr) : limit
  const lastRefill = lastRefillStr ? parseInt(lastRefillStr, 10) : now

  const timePassed = (now - lastRefill) / 1000
  const tokensToAdd = timePassed * refillRate
  tokens = Math.min(limit, tokens + tokensToAdd)

  const success = tokens >= 1

  if (success) {
    tokens -= 1
  }

  await Promise.all([
    redis.set(bucketKey, tokens.toString()),
    redis.set(timestampKey, now.toString()),
    redis.expire(bucketKey, window * 2),
    redis.expire(timestampKey, window * 2),
  ])

  const remaining = Math.floor(tokens)
  const reset = now + Math.ceil(((1 - tokens) / refillRate) * 1000)

  return {
    success,
    limit,
    remaining,
    reset,
    pending: Promise.resolve(),
  }
}
