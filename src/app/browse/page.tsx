import { prisma } from '@/lib/db';
import Link from 'next/link';
import { BUSINESS_CATEGORIES, EMIRATES } from '@/lib/constants';

async function getCategoriesData() {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: { ordering: 'asc' },
  });
}

async function getProfilesCountByCategory() {
  const categories = await prisma.category.findMany({
    where: { active: true, type: 'personal' },
    include: {
      personalProfiles: { where: { active: true } },
    },
  });
  return categories;
}

export default async function BrowsePage() {
  const businessCategories = BUSINESS_CATEGORIES;
  const emirates = EMIRATES;

  return (
    <main className="container-content">
      <div className="space-y-12">
        {/* Browse by Business Category */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">
            Browse Businesses by Category
          </h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {businessCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/search?category=${cat.slug}&type=business`}
                className="card p-4 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-2">{cat.icon}</div>
                <h3 className="font-semibold text-text">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Browse by Location */}
        <section>
          <h2 className="text-2xl font-bold text-primary mb-6">
            Browse by Location
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {emirates.map((emirate) => (
              <Link
                key={emirate.slug}
                href={`/search?emirate=${emirate.name}`}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg text-text">
                  {emirate.name}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {emirate.cities.length} cities
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="card">
          <h2 className="text-xl font-bold text-primary mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/search" className="btn-primary">
              Search Profiles
            </Link>
            <Link href="/search?type=business" className="btn-secondary">
              Browse Businesses
            </Link>
            <Link href="/businesses/create" className="btn-accent">
              Create Business Page
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
