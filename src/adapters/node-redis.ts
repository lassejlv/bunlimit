import type { RedisClientType } from 'redis'
import type { RedisAdapter } from './types.ts'

export class NodeRedisAdapter implements RedisAdapter {
  constructor(private client: RedisClientType) {}

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
      await this.client.del(keys)
    }
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern)
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    return await this.client.hIncrBy(key, field, increment)
  }

  async hmget(key: string, fields: string[]): Promise<(string | null)[]> {
    const result = await this.client.hmGet(key, fields)
    return result.map((value) => value ?? null)
  }

  async hmset(key: string, data: string[]): Promise<void> {
    const obj: Record<string, string> = {}
    for (let i = 0; i < data.length; i += 2) {
      obj[data[i]!] = data[i + 1]!
    }
    await this.client.hSet(key, obj)
  }
}
