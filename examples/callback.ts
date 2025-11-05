import { RedisClient } from 'bun'
import { Ratelimit, fixedWindow } from '../src/index.ts'

const redis = new RedisClient('redis://localhost:6379')

async function sendEmail(userId: string, resetTime: number) {
  console.log(`📧 Sending email to ${userId}`)
  console.log(`   Message: Rate limit exceeded. Try again at ${new Date(resetTime).toLocaleTimeString()}`)
}

async function logToAnalytics(userId: string, response: any) {
  console.log(`📊 Logging to analytics system`)
  console.log(`   User: ${userId}`)
  console.log(`   Remaining: ${response.remaining}`)
  console.log(`   Reset: ${new Date(response.reset).toLocaleTimeString()}`)
}

const ratelimit = new Ratelimit({
  redis,
  limiter: fixedWindow(3, 10),
  prefix: 'example:callback',
  onLimitExceeded: async (identifier, response) => {
    console.log(`\n⚠️  Rate limit exceeded for ${identifier}`)

    await sendEmail(identifier, response.reset)
    await logToAnalytics(identifier, response)
  },
})

async function main() {
  console.log('=== Rate Limit Callback Example ===\n')

  for (let i = 1; i <= 5; i++) {
    const result = await ratelimit.limit('user-123')
    console.log(`\nRequest ${i}: ${result.success ? '✓ Allowed' : '✗ Denied'}`)
    console.log(`Remaining: ${result.remaining}`)

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  redis.close()
}

main()
