import dotenv from 'dotenv'
dotenv.config({ path: '.env.dev' })

import { cacheContexts } from '../constants/cache-contexts'
import { Redis, ClusterNode, ClusterOptions, RedisOptions } from 'ioredis'

interface CacheConfig {
  redis: RedisOptions
  cluster: {
    nodes: ClusterNode[]
    options?: ClusterOptions
  }
}

const cacheConfig: CacheConfig = {
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
  cluster: {
    nodes: [
      {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    ],
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
    this.client = new Redis(cacheConfig.redis)
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
