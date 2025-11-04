# Quick Start Guide

## Installation

```bash
bun add bunlimit
```

## Basic Usage

```typescript
import { RedisClient } from 'bun'
import { Ratelimit, fixedWindow } from 'bunlimit'

const redis = new RedisClient('redis://localhost:6379')

const ratelimit = new Ratelimit({
  redis,
  limiter: fixedWindow(10, 60),
})

const { success } = await ratelimit.limit('user-123')
```

## Choose Your Algorithm

### Fixed Window (Simple & Fast)

```typescript
limiter: fixedWindow(10, 60)
```

10 requests per 60 seconds

### Sliding Window (More Accurate)

```typescript
limiter: slidingWindow(10, 60)
```

Prevents burst at window boundaries

### Token Bucket (Allows Bursts)

```typescript
limiter: tokenBucket(10, 60, 0.5)
```

10 tokens, refills at 0.5 tokens/second

## Real-World Example

```typescript
import { RedisClient } from 'bun'
import { Ratelimit, slidingWindow } from 'bunlimit'

const redis = new RedisClient()
const ratelimit = new Ratelimit({
  redis,
  limiter: slidingWindow(100, 60),
  prefix: 'api',
})

Bun.serve({
  async fetch(req) {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const { success, remaining, reset } = await ratelimit.limit(ip)

    if (!success) {
      return new Response('Too many requests', { status: 429 })
    }

    return new Response('Success', {
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
      },
    })
  },
})
```

## Run Examples

```bash
bun run examples/basic.ts
```

## Run Tests

```bash
bun test
```

Make sure Redis is running on `localhost:6379` or set `REDIS_URL` environment variable.
