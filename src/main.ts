import express, { Request, Response } from 'express'
import { RedisClient } from './lib/redis-client'
import { ClusterClient } from './lib/cluster-client'
import { cacheContexts, CacheContexts } from './constants/cache-contexts'

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 3000

app.use(express.json())

const cache =
  process.env.REDIS_CLUSTER === 'true' ? new ClusterClient() : new RedisClient()

app.get('/', async (_req: Request, res: Response) => {
  const values = await cache.list()
  res.status(200).send({ total: values.length, values })
})

app.post('/create', async (req: Request, res: Response) => {
  await cache.save({
    key: String(new Date().getTime()),
    value: req.body,
    expiresInSeconds: 600,
    context: cacheContexts.persons,
  })

  res.status(204).send('Created')
})

app.delete('/delete/:key', async (req: Request, res: Response) => {
  const { key } = req.params

  await cache.delete(key)

  res.status(204).send('Key Deleted')
})

app.delete(
  '/delete/:cacheContext/all/clear',
  async (req: Request, res: Response) => {
    const { cacheContext } = req.params

    await cache.clearCacheByContext(cacheContext as CacheContexts)

    res.status(204).send('Context Deleted')
  },
)

app.delete('/flushall', async (_req: Request, res: Response) => {
  await cache.flushAll()

  res.status(204).send('Flushed')
})

app.listen(port, () => {
  console.log(
    `\x1b[32m✅ Server is running on http://localhost:${port} \x1b[0m`,
  )
})
