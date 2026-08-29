import { PrismaClient } from '@prisma/client';
import {
  BUSINESS_CATEGORIES,
  PERSONAL_CATEGORIES,
  EMIRATES,
} from '../src/lib/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed business categories
  for (const cat of BUSINESS_CATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          slug: cat.slug,
          name: cat.name,
          icon: cat.icon,
          type: 'business',
          active: true,
          ordering: BUSINESS_CATEGORIES.indexOf(cat),
        },
      });
      console.log(`✓ Created business category: ${cat.name}`);
    }
  }

  // Seed personal categories
  for (const cat of PERSONAL_CATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          slug: cat.slug,
          name: cat.name,
          icon: cat.icon,
          type: 'personal',
          active: true,
          ordering: PERSONAL_CATEGORIES.indexOf(cat),
        },
      });
      console.log(`✓ Created personal category: ${cat.name}`);
    }
  }

  // Seed locations (emirate → city → area)
  const locationData = {
    'Abu Dhabi': {
      lat: 24.4539,
      lng: 54.3773,
      cities: {
        'Abu Dhabi': ['Downtown Abu Dhabi', 'Corniche', 'Al Baraha'],
        'Al Ain': ['Al Ain City', 'Foah'],
        'Madinat Zayed': ['Madinat Zayed'],
      },
    },
    Dubai: {
      lat: 25.276987,
      lng: 55.29676,
      cities: {
        Dubai: ['Downtown Dubai', 'Jumeirah', 'Marina', 'Deira', 'Bur Dubai'],
        'Jebel Ali': ['Jebel Ali'],
        Hatta: ['Hatta'],
      },
    },
    Sharjah: {
      lat: 25.3825,
      lng: 55.4093,
      cities: {
        Sharjah: ['Sharjah City', 'Rolla'],
        'Khor Fakkan': ['Khor Fakkan'],
        Kalba: ['Kalba'],
      },
    },
    Ajman: {
      lat: 25.4084,
      lng: 55.4667,
      cities: {
        Ajman: ['Ajman City'],
        Manama: ['Manama'],
      },
    },
    'Umm Al Quwain': {
      lat: 25.5648,
      lng: 55.5437,
      cities: {
        'Umm Al Quwain': ['Umm Al Quwain City'],
      },
    },
    Fujairah: {
      lat: 25.1282,
      lng: 56.3464,
      cities: {
        Fujairah: ['Fujairah City'],
      },
    },
    'Ras Al Khaimah': {
      lat: 25.7482,
      lng: 55.9892,
      cities: {
        'Ras Al Khaimah': ['Ras Al Khaimah City'],
      },
    },
  };

  for (const [emirate, emirateData] of Object.entries(locationData)) {
    for (const [city, areas] of Object.entries(emirateData.cities)) {
      for (const area of areas) {
        const existing = await prisma.location.findUnique({
          where: { emirate_city_area: { emirate, city, area } },
        });

        if (!existing) {
          await prisma.location.create({
            data: {
              emirate,
              city,
              area,
              centerLat: emirateData.lat,
              centerLng: emirateData.lng,
            },
          });
          console.log(`✓ Created location: ${emirate} → ${city} → ${area}`);
        }
      }
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
