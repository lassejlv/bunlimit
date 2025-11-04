import { RedisClient } from 'bun'
import { Ratelimit, fixedWindow, slidingWindow, tokenBucket } from '../src/index.ts'

const redis = new RedisClient('redis://localhost:6379')

async function fixedWindowExample() {
  console.log('\n=== Fixed Window Example ===')
  const ratelimit = new Ratelimit({
    redis,
    limiter: fixedWindow(5, 10),
    prefix: 'example:fixed',
  })

  for (let i = 1; i <= 7; i++) {
    const result = await ratelimit.limit('user-123')
    console.log(`Request ${i}: ${result.success ? '✓' : '✗'} - Remaining: ${result.remaining}`)
  }
}

async function slidingWindowExample() {
  console.log('\n=== Sliding Window Example ===')
  const ratelimit = new Ratelimit({
    redis,
    limiter: slidingWindow(5, 10),
    prefix: 'example:sliding',
  })

  for (let i = 1; i <= 7; i++) {
    const result = await ratelimit.limit('user-456')
    console.log(`Request ${i}: ${result.success ? '✓' : '✗'} - Remaining: ${result.remaining}`)
  }
}

async function tokenBucketExample() {
  console.log('\n=== Token Bucket Example ===')
  const ratelimit = new Ratelimit({
    redis,
    limiter: tokenBucket(5, 10, 1),
    prefix: 'example:token',
  })

  for (let i = 1; i <= 7; i++) {
    const result = await ratelimit.limit('user-789')
    console.log(`Request ${i}: ${result.success ? '✓' : '✗'} - Remaining: ${result.remaining}`)
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

async function analyticsExample() {
  console.log('\n=== Analytics Example ===')
  const ratelimit = new Ratelimit({
    redis,
    limiter: fixedWindow(3, 10),
    prefix: 'example:analytics',
    analytics: true,
  })

  for (let i = 1; i <= 5; i++) {
    await ratelimit.limit('user-analytics')
  }

  const stats = await ratelimit.getAnalytics('user-analytics')
  console.log(`Allowed: ${stats?.allowed}, Denied: ${stats?.denied}`)
}

async function multiLimitExample() {
  console.log('\n=== Multi-Limit Example ===')
  const ratelimit = new Ratelimit({
    redis,
    limiter: fixedWindow(3, 10),
    prefix: 'example:multi',
  })

  const results = await ratelimit.multiLimit(['user-1', 'user-2', 'user-3'])

  for (const result of results) {
    console.log(`${result.identifier}: ${result.success ? '✓' : '✗'} - Remaining: ${result.remaining}`)
  }
}

async function httpServerExample() {
  console.log('\n=== HTTP Server Example ===')
  const ratelimit = new Ratelimit({
    redis,
    limiter: slidingWindow(10, 60),
    prefix: 'example:http',
  })

  Bun.serve({
    port: 3000,
    async fetch(req) {
      const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
      const { success, remaining, reset, limit } = await ratelimit.limit(ip)

      if (!success) {
        return new Response('Rate limit exceeded', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
          },
        })
      }

      return new Response('Hello World', {
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    },
  })

  console.log('Server running on http://localhost:3000')
  console.log('Try: curl -v http://localhost:3000')
}

async function main() {
  try {
    await fixedWindowExample()
    await slidingWindowExample()
    await tokenBucketExample()
    await analyticsExample()
    await multiLimitExample()

    console.log('\n=== Starting HTTP Server ===')
    console.log('Uncomment the line below to run the server example')

    if (process.argv.includes('--server')) {
      await httpServerExample()
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    redis.close()
  }
}

main()
