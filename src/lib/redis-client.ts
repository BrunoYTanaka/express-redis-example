import dotenv from 'dotenv'
dotenv.config({ path: '.env.dev' })

import { cacheContexts } from '../constants/cache-contexts'
import { Redis, RedisOptions } from 'ioredis'

const cacheConfig: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 10,
  reconnectOnError: (error) => {
    const targetError = 'READONLY'
    if (error.message.slice(0, targetError.length) === targetError) {
      return true
    }
    return false
  },
}

type ValueOf<T> = T[keyof T]

interface ISave<T> {
  key: string
  value: T
  expiresInSeconds: number
  context?: ValueOf<typeof cacheContexts>
}
class RedisClient {
  public client: Redis

  constructor() {
    this.client = new Redis(cacheConfig)

    this.client.on('ready', () => {
      console.log('\x1b[31m🚀 Connected to Redis Server \x1b[0m')
    })
  }

  async save<T>({
    key,
    value,
    expiresInSeconds,
    context = cacheContexts.others,
  }: ISave<T>): Promise<void> {
    const fullKey = `${context}:${key}`

    await this.client.set(
      fullKey,
      JSON.stringify(value),
      'EX',
      expiresInSeconds,
    )
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key)

    if (!data) {
      return null
    }

    return JSON.parse(data)
  }

  async list<T>(): Promise<Array<{ key: string; value: T | null }>> {
    const keys = await this.client.keys('*')
    const values = await Promise.all(
      keys.map(async (key: string) => {
        const value = await this.get<T>(key)
        return { key, value }
      }),
    )

    return values
  }

  async delete(key: string): Promise<void> {
    const data = await this.client.get(key)

    if (!data) {
      return null
    }

    await this.client.del(key)
  }

  async flushAll(): Promise<void> {
    await this.client.flushall()
  }

  async clearCacheByContext(
    context: ValueOf<typeof cacheContexts>,
  ): Promise<void> {
    const keysToDelete = await this.client.keys(`${context}:*`)

    if (!keysToDelete || keysToDelete.length === 0) {
      return null
    }

    await this.client.del(keysToDelete)
  }
}

export { RedisClient }
