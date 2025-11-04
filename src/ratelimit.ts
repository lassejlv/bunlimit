import type { RatelimitConfig, RatelimitResponse, MultiRatelimitResponse } from './types.ts'
import { fixedWindow } from './algorithms/fixed-window.ts'
import { slidingWindow } from './algorithms/sliding-window.ts'
import { tokenBucket } from './algorithms/token-bucket.ts'

export class Ratelimit {
  private redis
  private limiter
  private prefix
  private analytics

  constructor(config: RatelimitConfig) {
    this.redis = config.redis
    this.limiter = config.limiter
    this.prefix = config.prefix ?? 'ratelimit'
    this.analytics = config.analytics ?? false
  }

  async limit(identifier: string): Promise<RatelimitResponse> {
    const key = `${this.prefix}:${identifier}`

    let result: RatelimitResponse

    switch (this.limiter.type) {
      case 'fixed-window':
        result = await fixedWindow(this.redis, key, this.limiter.limit, this.limiter.window)
        break
      case 'sliding-window':
        result = await slidingWindow(this.redis, key, this.limiter.limit, this.limiter.window)
        break
      case 'token-bucket':
        result = await tokenBucket(this.redis, key, this.limiter.limit, this.limiter.window, this.limiter.refillRate ?? this.limiter.limit / this.limiter.window)
        break
    }

    if (this.analytics) {
      await this.recordAnalytics(identifier, result.success)
    }

    return result
  }

  async multiLimit(identifiers: string[]): Promise<MultiRatelimitResponse[]> {
    const results = await Promise.all(
      identifiers.map(async (identifier) => {
        const result = await this.limit(identifier)
        return {
          identifier,
          ...result,
        }
      })
    )

    return results
  }

  async reset(identifier: string): Promise<void> {
    const pattern = `${this.prefix}:${identifier}*`
    const keys = await this.redis.keys(pattern)

    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  async getRemaining(identifier: string): Promise<number> {
    const result = await this.limit(identifier)
    return result.remaining
  }

  private async recordAnalytics(identifier: string, success: boolean): Promise<void> {
    const analyticsKey = `${this.prefix}:analytics:${identifier}`
    const field = success ? 'allowed' : 'denied'

    await this.redis.hincrby(analyticsKey, field, 1)
    await this.redis.expire(analyticsKey, 86400)
  }

  async getAnalytics(identifier: string): Promise<{
    allowed: number
    denied: number
  } | null> {
    if (!this.analytics) {
      return null
    }

    const analyticsKey = `${this.prefix}:analytics:${identifier}`
    const [allowed, denied] = await this.redis.hmget(analyticsKey, ['allowed', 'denied'])

    return {
      allowed: allowed ? parseInt(allowed, 10) : 0,
      denied: denied ? parseInt(denied, 10) : 0,
    }
  }
}
