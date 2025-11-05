import { createClient } from 'redis'
import { Ratelimit, NodeRedisAdapter, slidingWindow } from '../src/index.ts'

const redis = createClient({
  url: 'redis://localhost:6379',
})

await redis.connect()

const ratelimit = new Ratelimit({
  adapter: new NodeRedisAdapter(redis),
  limiter: slidingWindow(5, 10),
  prefix: 'node-redis-example',
})

async function main() {
  console.log('=== node-redis Adapter Example ===\n')

  for (let i = 1; i <= 7; i++) {
    const result = await ratelimit.limit('user-456')
    console.log(`Request ${i}: ${result.success ? '✓' : '✗'} - Remaining: ${result.remaining}`)
  }

  await redis.quit()
}

main()
