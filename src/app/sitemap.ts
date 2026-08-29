import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { BUSINESS_CATEGORIES, EMIRATES } from '@/lib/constants';

export const revalidate = 3600; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://uaemalayalees.com';

  // Fetch dynamic URLs
  const [profiles, businesses] = await Promise.all([
    prisma.personalProfile.findMany({
      where: { active: true },
      select: { username: true, updatedAt: true },
      take: 10000,
    }),
    prisma.businessPage.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
      take: 10000,
    }),
  ]);

  const profileUrls = profiles.map((p) => ({
    url: `${baseUrl}/profile/${p.username}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const businessUrls = businesses.map((b) => ({
    url: `${baseUrl}/business/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryUrls = BUSINESS_CATEGORIES.map((c) => ({
    url: `${baseUrl}/search?category=${c.slug}&type=business`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const emirateUrls = EMIRATES.map((e) => ({
    url: `${baseUrl}/search?emirate=${e.name}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...staticUrls, ...profileUrls, ...businessUrls, ...categoryUrls, ...emirateUrls];
}
