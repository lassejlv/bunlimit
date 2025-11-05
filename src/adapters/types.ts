export interface RedisAdapter {
  incr(key: string): Promise<number>
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  expire(key: string, seconds: number): Promise<void>
  del(...keys: string[]): Promise<void>
  keys(pattern: string): Promise<string[]>
  hincrby(key: string, field: string, increment: number): Promise<number>
  hmget(key: string, fields: string[]): Promise<(string | null)[]>
  hmset(key: string, data: string[]): Promise<void>
}
