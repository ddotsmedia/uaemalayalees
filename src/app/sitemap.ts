import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { BUSINESS_CATEGORIES, EMIRATES } from '@/lib/constants';

// Rendered per request so the build never queries the database; the
// queries below are cached for 1 hour instead.
export const dynamic = 'force-dynamic';

const getSitemapRows = unstable_cache(
  async () =>
    Promise.all([
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
    ]),
  ['sitemap-rows'],
  { revalidate: 3600 }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://uaemalayalees.com';

  // Fetch dynamic URLs
  const [profiles, businesses] = await getSitemapRows();

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
