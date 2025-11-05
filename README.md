# bunlimit

A simple and powerful rate limiting library for Bun, using Bun's native Redis client. Inspired by Upstash Ratelimit.

## Features

- 🚀 Built for Bun's native Redis client
- 🔌 Adapter API for ioredis, node-redis, and custom clients
- 🎯 Multiple rate limiting algorithms (Fixed Window, Sliding Window, Token Bucket)
- 📊 Optional analytics tracking
- 🔄 Multi-identifier rate limiting
- 💪 TypeScript support with full type safety
- ⚡ Simple and intuitive API

## Installation

```bash
bun add bunlimit
```

## Quick Start

### Using Bun's Redis Client

```typescript
import { RedisClient } from 'bun'
import { Ratelimit, fixedWindow } from 'bunlimit'

const redis = new RedisClient('redis://localhost:6379')

const ratelimit = new Ratelimit({
  redis,
  limiter: fixedWindow(10, 60),
  prefix: 'myapp',
})

const { success, limit, remaining, reset } = await ratelimit.limit('user-123')

if (!success) {
  console.log('Rate limit exceeded!')
}
```

### Using ioredis

```typescript
import Redis from 'ioredis'
import { Ratelimit, IoRedisAdapter, fixedWindow } from 'bunlimit'

const redis = new Redis()

const ratelimit = new Ratelimit({
  adapter: new IoRedisAdapter(redis),
  limiter: fixedWindow(10, 60),
})

const { success } = await ratelimit.limit('user-123')
```

### Using node-redis

```typescript
import { createClient } from 'redis'
import { Ratelimit, NodeRedisAdapter, fixedWindow } from 'bunlimit'

const redis = createClient()
await redis.connect()

const ratelimit = new Ratelimit({
  adapter: new NodeRedisAdapter(redis),
  limiter: fixedWindow(10, 60),
})

const { success } = await ratelimit.limit('user-123')
```

## Algorithms

### Fixed Window

Limits requests in fixed time windows. Simple and memory efficient.

```typescript
import { fixedWindow } from 'bunlimit'

const ratelimit = new Ratelimit({
  redis,
  limiter: fixedWindow(10, 60),
})
```

### Sliding Window

More accurate than fixed window, prevents burst traffic at window boundaries.

```typescript
import { slidingWindow } from 'bunlimit'

const ratelimit = new Ratelimit({
  redis,
  limiter: slidingWindow(10, 60),
})
```

### Token Bucket

Allows bursts while maintaining average rate. Great for APIs.

```typescript
import { tokenBucket } from 'bunlimit'

const ratelimit = new Ratelimit({
  redis,
  limiter: tokenBucket(10, 60, 0.5),
})
```

## Usage Examples

### Basic Rate Limiting

```typescript
const { success, remaining, reset } = await ratelimit.limit('api-key-123')

if (!success) {
  throw new Error(`Rate limit exceeded. Try again at ${new Date(reset)}`)
}

console.log(`${remaining} requests remaining`)
```

### HTTP Server Integration

```typescript
import { RedisClient } from 'bun'
import { Ratelimit, slidingWindow } from 'bunlimit'

const redis = new RedisClient()
const ratelimit = new Ratelimit({
  redis,
  limiter: slidingWindow(100, 60),
})

Bun.serve({
  async fetch(req) {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const { success, remaining, reset } = await ratelimit.limit(ip)

    if (!success) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    }

    return new Response('Hello World', {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    })
  },
})
```

### Multiple Identifiers

```typescript
const results = await ratelimit.multiLimit(['user-1', 'user-2', 'user-3'])

for (const result of results) {
  console.log(`${result.identifier}: ${result.success ? 'allowed' : 'denied'}`)
}
```

### Analytics

```typescript
const ratelimit = new Ratelimit({
  redis,
  limiter: fixedWindow(10, 60),
  analytics: true,
})

await ratelimit.limit('user-123')

const stats = await ratelimit.getAnalytics('user-123')
console.log(`Allowed: ${stats.allowed}, Denied: ${stats.denied}`)
```

### Reset Rate Limit

```typescript
await ratelimit.reset('user-123')
```

### Check Remaining Requests

```typescript
const remaining = await ratelimit.getRemaining('user-123')
console.log(`${remaining} requests remaining`)
```

### Handle Rate Limit Exceeded

Use the `onLimitExceeded` callback to perform actions when users exceed their rate limit:

```typescript
const ratelimit = new Ratelimit({
  redis,
  limiter: fixedWindow(10, 60),
  onLimitExceeded: async (identifier, response) => {
    console.log(`Rate limit exceeded for ${identifier}`)
    console.log(`Try again at ${new Date(response.reset)}`)

    await sendNotification(identifier, {
      message: 'You have exceeded your rate limit',
      resetAt: response.reset,
    })
  },
})

const { success } = await ratelimit.limit('user-123')
```

**Common use cases:**

- Send email/SMS notifications
- Log to analytics systems
- Trigger alerts for suspicious activity
- Update user dashboards
- Queue background jobs

## API Reference

### `Ratelimit`

#### Constructor

```typescript
new Ratelimit(config: RatelimitConfig)
```

**Config Options:**

- `redis`: RedisClient instance from Bun (optional, either this or `adapter` required)
- `adapter`: RedisAdapter instance for custom Redis clients (optional, either this or `redis` required)
- `limiter`: Algorithm configuration (required)
- `prefix`: Key prefix for Redis (default: "ratelimit")
- `analytics`: Enable analytics tracking (default: false)
- `onLimitExceeded`: Callback function triggered when rate limit is exceeded (optional)

#### Methods

##### `limit(identifier: string): Promise<RatelimitResponse>`

Rate limit a single identifier.

**Returns:**

```typescript
{
  success: boolean
  limit: number
  remaining: number
  reset: number
  pending: Promise<unknown>
}
```

##### `multiLimit(identifiers: string[]): Promise<MultiRatelimitResponse[]>`

Rate limit multiple identifiers at once.

##### `reset(identifier: string): Promise<void>`

Reset rate limit for an identifier.

##### `getRemaining(identifier: string): Promise<number>`

Get remaining requests for an identifier.

##### `getAnalytics(identifier: string): Promise<{ allowed: number; denied: number } | null>`

Get analytics for an identifier (requires `analytics: true`).

### Algorithm Presets

#### `fixedWindow(limit: number, window: number)`

- `limit`: Maximum number of requests
- `window`: Time window in seconds

#### `slidingWindow(limit: number, window: number)`

- `limit`: Maximum number of requests
- `window`: Time window in seconds

#### `tokenBucket(limit: number, window: number, refillRate?: number)`

- `limit`: Maximum number of tokens
- `window`: Time window in seconds
- `refillRate`: Tokens per second (default: limit / window)

## Adapters

### Built-in Adapters

#### `BunRedisAdapter`

For Bun's native Redis client:

```typescript
import { RedisClient } from 'bun'
import { Ratelimit, BunRedisAdapter, fixedWindow } from 'bunlimit'

const redis = new RedisClient('redis://localhost:6379')

const ratelimit = new Ratelimit({
  adapter: new BunRedisAdapter(redis),
  limiter: fixedWindow(10, 60),
})
```

#### `IoRedisAdapter`

For ioredis:

```typescript
import Redis from 'ioredis'
import { Ratelimit, IoRedisAdapter, fixedWindow } from 'bunlimit'

const redis = new Redis({
  host: 'localhost',
  port: 6379,
})

const ratelimit = new Ratelimit({
  adapter: new IoRedisAdapter(redis),
  limiter: fixedWindow(10, 60),
})
```

#### `NodeRedisAdapter`

For node-redis (v4+):

```typescript
import { createClient } from 'redis'
import { Ratelimit, NodeRedisAdapter, fixedWindow } from 'bunlimit'

const redis = createClient()
await redis.connect()

const ratelimit = new Ratelimit({
  adapter: new NodeRedisAdapter(redis),
  limiter: fixedWindow(10, 60),
})
```

### Custom Adapters

You can create your own adapter by implementing the `RedisAdapter` interface:

```typescript
import type { RedisAdapter } from 'bunlimit'

class MyCustomAdapter implements RedisAdapter {
  async incr(key: string): Promise<number> {
    // Your implementation
  }

  async get(key: string): Promise<string | null> {
    // Your implementation
  }

  async set(key: string, value: string): Promise<void> {
    // Your implementation
  }

  async expire(key: string, seconds: number): Promise<void> {
    // Your implementation
  }

  async del(...keys: string[]): Promise<void> {
    // Your implementation
  }

  async keys(pattern: string): Promise<string[]> {
    // Your implementation
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    // Your implementation
  }

  async hmget(key: string, fields: string[]): Promise<(string | null)[]> {
    // Your implementation
  }

  async hmset(key: string, data: string[]): Promise<void> {
    // Your implementation
  }
}

const ratelimit = new Ratelimit({
  adapter: new MyCustomAdapter(),
  limiter: fixedWindow(10, 60),
})
```

## License

MIT
