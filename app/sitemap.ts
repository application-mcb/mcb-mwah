import type { MetadataRoute } from 'next'

const routes = ['/', '/login', '/dashboard', '/teacher', '/search']

const sitemap = (): MetadataRoute.Sitemap =>
  routes.map((route) => ({
    url: `https://marian.college${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))

export default sitemap

