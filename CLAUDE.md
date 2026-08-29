# UAE Malayalees - Project Context & Guidelines

## Project Overview

**Product**: UAE Malayalees - English-only social network for Malayalee individuals & businesses in UAE

**Vision**: Connect Malayalee professionals and business owners across Emirates through a discovery-first platform

**Current Phase**: Phase 1 (Weeks 1-4) - Core auth, profiles, businesses, search, moderation

## Tech Decisions (Locked)

- **Frontend**: Next.js 15 (App Router, RSC) + React 19
- **Backend**: Node.js via Next.js API routes
- **Database**: PostgreSQL (via Prisma ORM)
- **Search**: PostgreSQL full-text + ILIKE (defer Meilisearch to Phase 3+)
- **Auth**: NextAuth v4 with email/phone OTP (no OAuth in Phase 1)
- **Cache**: Redis (Upstash or Redis Cloud)
- **File Storage**: Cloudflare R2 (public media bucket)
- **UI**: Tailwind CSS 4 + custom design system (no shadcn/ui components yet - CSS only)
- **Deployment**: Vercel + managed PostgreSQL

**Color System** (Locked):
- Primary: Emerald #14958A
- Accent: Gold #D9A441
- Full light/dark mode via Tailwind CSS variables

## Entity Model (Locked)

```
User
├── PersonalProfile (1:1)
├── BusinessPage (1:many)
└── Session

PersonalProfile
├── Category (M:1)
├── Location (M:1)
├── Follow (M:many)
└── Connection (M:many)

BusinessPage
├── Category (M:1)
├── BusinessTeamMember (1:many)
└── Follow (M:many)

Verification (email + phone per user)
Report (for moderation)
AuditLog (for compliance)
```

## Current Implementation Status

### ✅ Complete (Phase 1.A-K)
- [x] Repository setup (Next.js, TypeScript, Tailwind)
- [x] Prisma schema with 11 entities
- [x] Auth: signup/verify-otp (OTP via Redis, 10min expiry)
- [x] Rate limiting: signup (1/5s, 10/24h), OTP attempts (max 5/hour)
- [x] Profile CRUD: create, read, update
- [x] Profile public page: SSR with JSON-LD Person schema
- [x] Business CRUD: create, read
- [x] Business public page: SSR with LocalBusiness schema
- [x] Search API: keyword + category + emirate filters
- [x] Browse UI: category/location navigation
- [x] Admin: category & location CRUD
- [x] Reports: submit & view (admin)
- [x] Moderation: update report status + suspend profiles
- [x] Design system: CSS variables (emerald/gold), Tailwind utilities
- [x] SEO: sitemap generation, robots.txt, og tags
- [x] Deployment: vercel.json, GitHub Actions CI/CD

### ✅ Complete (Phase 2.A-F)
- [x] Follow API: follow/unfollow profiles + businesses
- [x] Connect API: send/accept/reject connection requests
- [x] Followers list page: view followers with verification badges
- [x] Connection requests page: pending requests with accept/decline
- [x] Profile discovery API: suggested connections by category/location/native place
- [x] Discover page: browsable grid of suggested connections
- [x] Auto-suspend: profiles with 5+ reports auto-suspended
- [x] Admin moderation dashboard: view + action reports by status
- [x] Trade license verification: submit & admin approval
- [x] Verification settings page: track email/phone/trade license status
- [x] Activity feed API: activity from followed/connected users
- [x] Feed page: paginated timeline of profile updates + connections
- [x] Error pages: 404 and 500 error handling
- [x] Form validation: schemas for signup, profile, business, trade license
- [x] Error utilities: ApiError, error messages, error handling

### ✅ Complete (Phase 3.A-F)
- [x] Post/status updates: create, edit, delete (soft-delete), feed
- [x] Post validation: 500-char limit, 3-image max, 15-min edit window
- [x] Comments & nested replies: create, edit, delete, 300-char limit
- [x] Reaction system: 7 emoji types (like, heart, laugh, thinking, clapping, fire, rocket)
- [x] Reaction toggle: click to add, click again to remove, switch types
- [x] Notifications: 7 types (connection, comment, like, follow, reply, etc)
- [x] Notification API: fetch, mark as read, delete, bulk actions
- [x] Notification deduplication: prevent spam (1-hour window)
- [x] Notification triggers: auto-create on events (post like, comment, follow)
- [x] View tracking: daily-deduplicated view count per post
- [x] Engagement scoring: formula (likes×1 + comments×2 + replies×1.5 + views×0.1)
- [x] Engagement levels: new, regular, active, highly_engaged
- [x] Database optimization: composite indexes on frequently queried columns
- [x] Test structure: test file templates for posts, comments, reactions

### ⏳ TODO (Phase 2+)
- [ ] Photo upload to R2 (integration)
- [ ] Email OTP via Resend (integration)
- [ ] Phone OTP via Twilio (integration)
- [ ] Session/auth middleware from NextAuth.js
- [ ] Rate limiting: profile creation (1/24h), search (100/hour)
- [ ] Loading states & skeleton screens
- [ ] Client-side form validation (zod + React hooks)
- [ ] Toast/notification system
- [ ] Optimistic UI updates

### 🚀 Phase 2 (Weeks 5-8)
- Connect/Follow workflow
- Activity feed skeleton
- Notification system
- Enhanced verification (trade license upload)

## Coding Guidelines

### File Organization
- Routes in `src/app/api/` (Next.js API routes)
- Pages in `src/app/[path]/page.tsx` (Next.js App Router)
- Components in `src/components/` (future - not yet used)
- Lib utilities in `src/lib/` (db, redis, types, utils, constants)
- Tailwind CSS in `src/app/globals.css` (design tokens via @layer)

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate input
    // Execute logic
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Message' },
      { status: 500 }
    );
  }
}
```

### Response Format (Standard)
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "Error message" }

// With pagination
{ success: true, data: {...}, pagination: { page, limit, total, pages } }
```

### TypeScript
- Strict mode enabled (`tsconfig.json`: `"strict": true`)
- Use `@/lib/types.ts` for shared types
- No `any` - use `unknown` if needed, then narrow
- Import aliases: `@/` for src path

### Prisma
- Use `.findUnique()` for lookups by unique field
- Use `.findMany()` with `where` for filtered queries
- Always `include` relationships explicitly
- Use transactions for multi-step operations
- Store relations in `include`, not inline in data

### CSS & Styling
- No inline styles - use Tailwind utilities or @layer components
- Design tokens via CSS variables (`--color-primary`, `--space-md`, etc)
- Dark mode via `@media (prefers-color-scheme: dark)` + `[data-theme="dark"]`
- Component classes in `globals.css` (`.btn-primary`, `.card`, etc)

### Git Commits
Format: `<type>: <description>`
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code cleanup
- `docs:` documentation
- Keep commits atomic (one feature/fix per commit)
- Reference related PRs/issues

## Key Constants

- OTP expiry: 10 minutes
- OTP max attempts: 3 per hour
- Signup rate limit: 1 per IP per 5 sec, 10 per IP per 24h
- Profile creation rate limit: 1 per user per 24h
- Search rate limit: 100 per user per hour

## Deployment Notes

- Environment variables set via Vercel dashboard
- Database migrations: `npx prisma db push`
- All environment values required before deploy
- GitHub Actions auto-deploys on push to main/master
- Vercel URL: production-auto-assigned

## TODO Comments in Code

Search for `TODO:` comments to find incomplete work:
- Auth.js session integration (currently stubbed)
- Resend email OTP (currently stubbed with console.log)
- Twilio phone OTP (currently stubbed)
- Cloudflare R2 photo upload
- Follow/Connect UI components
- Activity feed implementation
- Error page templates

## Performance Considerations

- ISR (revalidate) set to 60s for profile/business pages
- Sitemap generation cached at 1 hour
- Redis TTL: OTP 10min, rate limit windows 1-24h
- Pagination: default 20, max 100
- Database indexes on commonly filtered fields

## Security Notes

- Passwords: Not used (OTP only)
- Session: httpOnly cookie (NextAuth)
- Rate limiting: Redis per IP + per user
- Admin routes: Need authentication middleware (TODO)
- CORS: Configured in middleware for API access
- SQL injection: Prisma parameterization prevents this

## Monitoring & Logging

- Console errors for API failures (enable structured logging later)
- Rate limit: 429 status code
- Validation errors: 400 status code
- Not found: 404 status code
- Server errors: 500 status code

## Next Steps (When Resuming)

1. Seed categories & locations data via Prisma seed script
2. Integrate Resend for email OTP (replace console.log)
3. Integrate Twilio for phone OTP
4. Integrate Cloudflare R2 for photo upload
5. Test signup → profile creation → public page flow end-to-end
6. Deploy to Vercel test environment
7. Begin Phase 2 (Follow/Connect relationships)
