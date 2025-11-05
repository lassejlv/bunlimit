import Redis from 'ioredis'
import { Ratelimit, IoRedisAdapter, fixedWindow } from '../src/index.ts'

const redis = new Redis({
  host: 'localhost',
  port: 6379,
})

const ratelimit = new Ratelimit({
  adapter: new IoRedisAdapter(redis),
  limiter: fixedWindow(5, 10),
  prefix: 'ioredis-example',
})

async function main() {
  console.log('=== ioredis Adapter Example ===\n')

  for (let i = 1; i <= 7; i++) {
    const result = await ratelimit.limit('user-123')
    console.log(`Request ${i}: ${result.success ? '✓' : '✗'} - Remaining: ${result.remaining}`)
  }

  await redis.quit()
}

main()
