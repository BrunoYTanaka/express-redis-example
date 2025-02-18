import dotenv from 'dotenv'
dotenv.config({ path: '.env.dev' })

import { cacheContexts } from '../constants/cache-contexts'
import { Cluster, ClusterNode, ClusterOptions } from 'ioredis'

const clusterNodes: ClusterNode[] = [
  {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
]

const clusterOptions: ClusterOptions = {
  enableReadyCheck: true,
  clusterRetryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  retryDelayOnFailover: 1000,
  retryDelayOnTryAgain: 1000,
}

type ValueOf<T> = T[keyof T]

interface ISave<T> {
  key: string
  value: T
  expiresInSeconds: number
  context?: ValueOf<typeof cacheContexts>
}
class ClusterClient {
  public client: Cluster

  constructor() {
    this.client = new Cluster(clusterNodes, clusterOptions)

    this.client.on('ready', () => {
      console.log('\x1b[35m🚀 Connected to Redis Cluster \x1b[0m')
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
    const keys = await this.scanKeysInCluster('*')
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
    const nodes = this.client.nodes('master')
    await Promise.all(nodes.map((node) => node.flushall()))
  }

  async clearCacheByContext(
    context: ValueOf<typeof cacheContexts>,
  ): Promise<void> {
    const keysToDelete = await this.scanKeysInCluster(`${context}:*`)

    if (!keysToDelete || keysToDelete.length === 0) {
      return null
    }

    for (const key of keysToDelete) {
      await this.client.del(key)
    }
  }

  private async scanKeysInCluster(keyPattern: string): Promise<string[]> {
    const keys = []

    for (const node of this.client.nodes('master')) {
      let cursor = '0'
      do {
        const reply = await node.scan(cursor, 'MATCH', keyPattern, 'COUNT', 150)
        cursor = reply[0]
        const foundKeys = reply[1]

        keys.push(...foundKeys)
      } while (cursor !== '0')
    }

    return keys
  }
}

export { ClusterClient }
