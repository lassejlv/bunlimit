import type { RatelimitConfig, RatelimitResponse, MultiRatelimitResponse } from './types.ts'
import type { RedisAdapter } from './adapters/types.ts'
import { BunRedisAdapter } from './adapters/bun.ts'
import { fixedWindow } from './algorithms/fixed-window.ts'
import { slidingWindow } from './algorithms/sliding-window.ts'
import { tokenBucket } from './algorithms/token-bucket.ts'

export class Ratelimit {
  private adapter: RedisAdapter
  private limiter
  private prefix
  private analytics
  private onLimitExceeded?: (identifier: string, response: RatelimitResponse) => void | Promise<void>

  constructor(config: RatelimitConfig) {
    if (!config.adapter && !config.redis) {
      throw new Error('Either adapter or redis must be provided')
    }

    this.adapter = config.adapter ?? new BunRedisAdapter(config.redis!)
    this.limiter = config.limiter
    this.prefix = config.prefix ?? 'ratelimit'
    this.analytics = config.analytics ?? false
    this.onLimitExceeded = config.onLimitExceeded
  }

  async limit(identifier: string): Promise<RatelimitResponse> {
    const key = `${this.prefix}:${identifier}`

    let result: RatelimitResponse

    switch (this.limiter.type) {
      case 'fixed-window':
        result = await fixedWindow(this.adapter, key, this.limiter.limit, this.limiter.window)
        break
      case 'sliding-window':
        result = await slidingWindow(this.adapter, key, this.limiter.limit, this.limiter.window)
        break
      case 'token-bucket':
        result = await tokenBucket(this.adapter, key, this.limiter.limit, this.limiter.window, this.limiter.refillRate ?? this.limiter.limit / this.limiter.window)
        break
    }

    if (this.analytics) {
      await this.recordAnalytics(identifier, result.success)
    }

    if (!result.success && this.onLimitExceeded) {
      await this.onLimitExceeded(identifier, result)
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
    const keys = await this.adapter.keys(pattern)

    if (keys.length > 0) {
      await this.adapter.del(...keys)
    }
  }

  async getRemaining(identifier: string): Promise<number> {
    const result = await this.limit(identifier)
    return result.remaining
  }

  private async recordAnalytics(identifier: string, success: boolean): Promise<void> {
    const analyticsKey = `${this.prefix}:analytics:${identifier}`
    const field = success ? 'allowed' : 'denied'

    await this.adapter.hincrby(analyticsKey, field, 1)
    await this.adapter.expire(analyticsKey, 86400)
  }

  async getAnalytics(identifier: string): Promise<{
    allowed: number
    denied: number
  } | null> {
    if (!this.analytics) {
      return null
    }

    const analyticsKey = `${this.prefix}:analytics:${identifier}`
    const [allowed, denied] = await this.adapter.hmget(analyticsKey, ['allowed', 'denied'])

    return {
      allowed: allowed ? parseInt(allowed, 10) : 0,
      denied: denied ? parseInt(denied, 10) : 0,
    }
  }
}
