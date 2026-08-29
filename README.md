# UAE Malayalees - Social Network Platform

Connect with Malayalee individuals and businesses across the UAE.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database
- Redis instance

### Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd uaemalayalees
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Database setup**
   ```bash
   npx prisma db push
   npm run db:generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Auth**: NextAuth v4 with email/phone OTP
- **File Storage**: Cloudflare R2
- **Deployment**: Vercel

### Project Structure
```
src/
  app/
    api/          # API routes
    auth/         # Auth pages (login, etc)
    profile/      # Profile pages (public)
    business/     # Business pages (public)
    search/       # Search & discovery
    browse/       # Browse by category/location
    onboarding/   # Profile creation
  lib/
    db.ts         # Prisma client
    redis.ts      # Redis client
    types.ts      # TypeScript types
    utils.ts      # Utility functions
    constants.ts  # Constants (categories, locations)
  components/     # React components (future)
  middleware.ts   # NextAuth middleware
prisma/
  schema.prisma   # Database schema
public/
  robots.txt      # SEO
.env.example      # Environment variables template
```

## Features (Phase 1)

### Authentication
- Email & phone OTP signup/login
- Redis-backed OTP (10-min expiry)
- Rate limiting (1 signup per 5s, 10 per 24h)

### Profiles
- Personal profile creation (name, headline, bio, photo)
- Profile categories (healthcare, engineers, etc)
- Public profile pages with SSR
- Verification badges (email + phone)

### Businesses
- Business page creation
- Multi-location support
- Business hours & contact info
- Team member management

### Discovery
- Full-text search (keyword, category, location)
- Browse by business category
- Browse by emirate/city/area
- Faceted filtering

### Moderation
- Report profiles/businesses (spam, fake, inappropriate)
- Admin moderation queue
- Suspend/delete profiles
- Report status tracking

### SEO
- JSON-LD schemas (Person, Organization, LocalBusiness)
- og:image, og:title, og:description
- Dynamic sitemap
- robots.txt

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP & create user
- `GET /api/auth/session` - Get current session

### Profiles
- `POST /api/profiles` - Create profile
- `PATCH /api/profiles/[userId]` - Update profile
- `GET /api/profiles?username=X` - Get profile by username

### Businesses
- `POST /api/businesses` - Create business
- `PATCH /api/businesses/[businessId]` - Update business
- `GET /api/businesses?slug=X` - Get business by slug

### Search & Browse
- `GET /api/search?q=X&category=Y&emirate=Z` - Search profiles & businesses

### Reports
- `POST /api/reports` - Create report
- `GET /api/reports?status=NEW` - List reports (admin)
- `PATCH /api/admin/reports/[reportId]` - Action report

### Admin
- `GET/POST /api/admin/categories` - Manage categories
- `GET/POST /api/admin/locations` - Manage locations

## Environment Variables

See `.env.example` for all required variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `NEXTAUTH_SECRET` - Auth secret (min 32 chars)
- `RESEND_API_KEY` - Email OTP provider
- `TWILIO_*` - Phone OTP provider
- `R2_*` - Cloudflare file storage

## Deployment

### Vercel
1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Auto-deploy on push to main/master
4. Run Prisma migrations: `npx prisma db push`

## Development

### Commit Convention
```
feat: short description
fix: bug description
docs: documentation
refactor: code cleanup
test: test additions
```

### Code Quality
- ESLint configuration included
- TypeScript strict mode enabled
- Prettier auto-formatting

## Phase 2-4 Roadmap

### Phase 2 (Weeks 5-8)
- Connect/Follow relationships
- Activity feed
- Notifications
- Enhanced verification (trade license)

### Phase 3 (Weeks 9-12)
- Activity/status updates
- Engagement metrics
- Comments & reactions

### Phase 4+ (Months 4-18)
- Reviews with moderation
- Premium tiers
- Analytics dashboard
- Mobile API
- Ad system

## Support

Contact: mammikutty@al-watan.ae

## License

All rights reserved - UAE Malayalees © 2025
