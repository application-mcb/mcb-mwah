import type { MetadataRoute } from 'next'

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: ['/api/', '/debugkit', '/registrar/print'],
  },
  sitemap: 'https://marian.college/sitemap.xml',
  host: 'https://marian.college',
})

export default robots

