import { openKv } from '@deno/kv'
import { Ratelimit, DenoKvAdapter, fixedWindow } from '../src/index.ts'

const kv = await openKv('http://localhost:4512')

const ratelimit = new Ratelimit({
  adapter: new DenoKvAdapter(kv as any),
  limiter: fixedWindow(5, 10),
  prefix: 'deno-kv-example',
})

async function main() {
  console.log('=== Deno KV Adapter Example ===\n')

  for (let i = 1; i <= 7; i++) {
    const result = await ratelimit.limit('user-123')
    console.log(`Request ${i}: ${result.success ? '✓' : '✗'} - Remaining: ${result.remaining}`)
  }

  await kv.close()
}

main()
