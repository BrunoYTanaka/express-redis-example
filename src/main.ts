import express, { Request, Response } from 'express'
import { RedisClient } from './lib/redis-client'
import { cacheContexts, CacheContexts } from './constants/cache-contexts'

const app = express()
const port = 3000

app.use(express.json())

const cache = new RedisClient()

app.get('/', async (_req: Request, res: Response) => {
  const keys = await cache.client.keys('*')
  const values = await Promise.all(
    keys.map(async (key: string) => {
      const value = await cache.get(key)
      return { key, value }
    }),
  )

  res.status(200).send(values)
})

app.post('/create', async (req: Request, res: Response) => {
  await cache.save({
    key: String(new Date().getTime()),
    value: req.body,
    expiresInSeconds: 600,
    context: cacheContexts.others,
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
  await cache.client.flushall()

  res.status(204).send('Flushed')
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
