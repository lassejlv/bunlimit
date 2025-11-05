import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { RedisClient } from 'bun'
import { Ratelimit, fixedWindow, slidingWindow, tokenBucket } from '../src/index.ts'

let redis: RedisClient

beforeAll(() => {
  redis = new RedisClient('redis://localhost:6379')
})

afterAll(() => {
  redis.close()
})

describe('Fixed Window', () => {
  test('should allow requests within limit', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(5, 10),
      prefix: 'test:fixed:1',
    })

    const result = await ratelimit.limit('user-1')
    expect(result.success).toBe(true)
    expect(result.limit).toBe(5)
  })

  test('should deny requests exceeding limit', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(2, 10),
      prefix: 'test:fixed:2',
    })

    await ratelimit.limit('user-2')
    await ratelimit.limit('user-2')
    const result = await ratelimit.limit('user-2')

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  test('should reset after calling reset', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(1, 10),
      prefix: 'test:fixed:3',
    })

    await ratelimit.limit('user-3')
    await ratelimit.reset('user-3')
    const result = await ratelimit.limit('user-3')

    expect(result.success).toBe(true)
  })
})

describe('Sliding Window', () => {
  test('should allow requests within limit', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: slidingWindow(5, 10),
      prefix: 'test:sliding:1',
    })

    const result = await ratelimit.limit('user-4')
    expect(result.success).toBe(true)
  })

  test('should deny requests exceeding limit', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: slidingWindow(2, 10),
      prefix: 'test:sliding:2',
    })

    await ratelimit.limit('user-5')
    await ratelimit.limit('user-5')
    const result = await ratelimit.limit('user-5')

    expect(result.success).toBe(false)
  })
})

describe('Token Bucket', () => {
  test('should allow requests within limit', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: tokenBucket(5, 10, 1),
      prefix: 'test:token:1',
    })

    const result = await ratelimit.limit('user-6')
    expect(result.success).toBe(true)
  })

  test('should deny requests exceeding limit', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: tokenBucket(2, 10, 0.1),
      prefix: 'test:token:2',
    })

    await ratelimit.limit('user-7')
    await ratelimit.limit('user-7')
    const result = await ratelimit.limit('user-7')

    expect(result.success).toBe(false)
  })
})

describe('Multi-Limit', () => {
  test('should rate limit multiple identifiers', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(5, 10),
      prefix: 'test:multi:1',
    })

    const results = await ratelimit.multiLimit(['user-8', 'user-9', 'user-10'])

    expect(results).toHaveLength(3)
    expect(results[0].identifier).toBe('user-8')
    expect(results[0].success).toBe(true)
  })
})

describe('Analytics', () => {
  test('should track allowed and denied requests', async () => {
    const uniqueId = `user-11-${Date.now()}`
    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(2, 10),
      prefix: 'test:analytics:1',
      analytics: true,
    })

    await ratelimit.limit(uniqueId)
    await ratelimit.limit(uniqueId)
    await ratelimit.limit(uniqueId)

    const stats = await ratelimit.getAnalytics(uniqueId)
    expect(stats?.allowed).toBe(2)
    expect(stats?.denied).toBe(1)
  })

  test('should return null when analytics disabled', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(5, 10),
      prefix: 'test:analytics:2',
      analytics: false,
    })

    const stats = await ratelimit.getAnalytics('user-12')
    expect(stats).toBeNull()
  })
})

describe('Get Remaining', () => {
  test('should return remaining requests', async () => {
    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(5, 10),
      prefix: 'test:remaining:1',
    })

    await ratelimit.limit('user-13')
    const remaining = await ratelimit.getRemaining('user-13')

    expect(remaining).toBeLessThanOrEqual(4)
  })
})

describe('onLimitExceeded Callback', () => {
  test('should trigger callback when limit exceeded', async () => {
    let callbackTriggered = false
    let callbackIdentifier = ''
    let callbackResponse: any = null

    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(1, 10),
      prefix: 'test:callback:1',
      onLimitExceeded: (identifier, response) => {
        callbackTriggered = true
        callbackIdentifier = identifier
        callbackResponse = response
      },
    })

    await ratelimit.limit('user-14')
    await ratelimit.limit('user-14')

    expect(callbackTriggered).toBe(true)
    expect(callbackIdentifier).toBe('user-14')
    expect(callbackResponse.success).toBe(false)
    expect(callbackResponse.remaining).toBe(0)
  })

  test('should not trigger callback when limit not exceeded', async () => {
    let callbackTriggered = false

    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(5, 10),
      prefix: 'test:callback:2',
      onLimitExceeded: () => {
        callbackTriggered = true
      },
    })

    await ratelimit.limit('user-15')

    expect(callbackTriggered).toBe(false)
  })

  test('should support async callback', async () => {
    const notifications: string[] = []

    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(1, 10),
      prefix: 'test:callback:3',
      onLimitExceeded: async (identifier) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        notifications.push(`Notified ${identifier}`)
      },
    })

    await ratelimit.limit('user-16')
    await ratelimit.limit('user-16')

    expect(notifications).toHaveLength(1)
    expect(notifications[0]).toBe('Notified user-16')
  })

  test('should work with multiLimit', async () => {
    const exceededIdentifiers: string[] = []

    const ratelimit = new Ratelimit({
      redis,
      limiter: fixedWindow(1, 10),
      prefix: 'test:callback:4',
      onLimitExceeded: (identifier) => {
        exceededIdentifiers.push(identifier)
      },
    })

    await ratelimit.limit('user-17')
    await ratelimit.limit('user-18')

    await ratelimit.multiLimit(['user-17', 'user-18', 'user-19'])

    expect(exceededIdentifiers).toContain('user-17')
    expect(exceededIdentifiers).toContain('user-18')
    expect(exceededIdentifiers).not.toContain('user-19')
  })
})
