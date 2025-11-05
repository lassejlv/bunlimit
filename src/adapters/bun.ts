import type { RedisClient } from 'bun'
import type { RedisAdapter } from './types.ts'

export class BunRedisAdapter implements RedisAdapter {
  constructor(private client: RedisClient) {}

  async incr(key: string): Promise<number> {
    return await this.client.incr(key)
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key)
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value)
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds)
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(...keys)
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern)
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    return await this.client.hincrby(key, field, increment)
  }

  async hmget(key: string, fields: string[]): Promise<(string | null)[]> {
    return await this.client.hmget(key, fields)
  }

  async hmset(key: string, data: string[]): Promise<void> {
    await this.client.hmset(key, data)
  }
}
