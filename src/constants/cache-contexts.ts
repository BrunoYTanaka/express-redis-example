type CacheContexts = keyof typeof cacheContexts

const cacheContexts = {
  persons: 'persons',
  others: 'others',
} as const

export { cacheContexts, CacheContexts }
