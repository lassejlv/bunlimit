import type { RedisAdapter } from './types.ts'

type DenoKv = {
  get(key: string[]): Promise<{ value: string | null }>
  set(key: string[], value: string): Promise<void>
  delete(key: string[]): Promise<void>
  list(selector: { prefix: string[] }): AsyncIterableIterator<{ key: string[] }>
  atomic(): {
    set(key: string[], value: string): any
    sum(key: string[], value: bigint): any
    commit(): Promise<{ ok: boolean }>
  }
}

export class DenoKvAdapter implements RedisAdapter {
  constructor(private kv: DenoKv) {}

  async incr(key: string): Promise<number> {
    const result = await this.kv.atomic().sum([key], 1n).commit()
    if (!result.ok) {
      throw new Error('Failed to increment key')
    }
    const entry = await this.kv.get([key])
    return entry.value ? parseInt(entry.value, 10) : 1
  }

  async get(key: string): Promise<string | null> {
    const entry = await this.kv.get([key])
    return entry.value
  }

  async set(key: string, value: string): Promise<void> {
    await this.kv.set([key], value)
  }

  async expire(key: string, seconds: number): Promise<void> {
    const expiresAt = Date.now() + seconds * 1000
    await this.kv.set([`${key}:expires`], expiresAt.toString())
  }

  async del(...keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.kv.delete([key])
      await this.kv.delete([`${key}:expires`])
    }
  }

  async keys(pattern: string): Promise<string[]> {
    const prefix = pattern.replace(/\*/g, '')
    const keys: string[] = []

    for await (const entry of this.kv.list({ prefix: [prefix] })) {
      if (!entry.key[0]?.toString().includes(':expires')) {
        keys.push(entry.key[0]?.toString() || '')
      }
    }

    return keys
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    const hashKey = `${key}:${field}`
    const entry = await this.kv.get([hashKey])
    const current = entry.value ? parseInt(entry.value, 10) : 0
    const newValue = current + increment

    await this.kv.set([hashKey], newValue.toString())
    return newValue
  }

  async hmget(key: string, fields: string[]): Promise<(string | null)[]> {
    const results: (string | null)[] = []

    for (const field of fields) {
      const entry = await this.kv.get([`${key}:${field}`])
      results.push(entry.value)
    }

    return results
  }

  async hmset(key: string, data: string[]): Promise<void> {
    for (let i = 0; i < data.length; i += 2) {
      const field = data[i]
      const value = data[i + 1]
      if (field && value) {
        await this.kv.set([`${key}:${field}`], value)
      }
    }
  }

  private async checkExpiration(key: string): Promise<boolean> {
    const expiresEntry = await this.kv.get([`${key}:expires`])
    if (expiresEntry.value) {
      const expiresAt = parseInt(expiresEntry.value, 10)
      if (Date.now() > expiresAt) {
        await this.kv.delete([key])
        await this.kv.delete([`${key}:expires`])
        return true
      }
    }
    return false
  }
}
