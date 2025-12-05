# Cursed Tours - Headless WordPress Blog (Next.js)

## Overview

Cursed Tours is a modern, headless WordPress blog/magazine focused on paranormal investigations and ghost stories. The application uses WordPress as a headless CMS, consuming data via the WordPress REST API, with a Next.js frontend for optimal SEO and performance.

**Site Branding:** "CURSED TOURS" with tagline "Some Boundaries Aren't Meant to Be Crossed"

## System Architecture

### Frontend (Next.js App Router)

**Framework & Build Tools:**
- **Next.js 16** with App Router for server-side rendering and static generation
- **TypeScript** for type-safe development
- **Tailwind CSS** for utility-first styling
- **next-themes** for dark/light mode support

**UI Component System:**
- **Shadcn/ui** components built on Radix UI primitives
- **Lucide React** for iconography
- **React Icons** for social media logos
- Design inspired by Ncmaz Next.js theme (indigo primary, teal secondary, rounded-3xl, glassmorphism)

### Key Files

```
app/
├── layout.tsx          # Root layout with Header/Footer
├── page.tsx            # Homepage with hero and post grid
├── globals.css         # Tailwind styles and theme variables
├── category/[slug]/    # Category archive pages
├── post/[slug]/        # Single post pages
└── search/             # Search results page

components/
├── header.tsx          # Site header with navigation
├── footer.tsx          # Site footer with links
├── hero-section.tsx    # Featured post hero
├── post-card.tsx       # Post card component
├── category-nav.tsx    # Category filter chips
├── theme-provider.tsx  # Dark mode provider
├── theme-toggle.tsx    # Dark/light toggle
└── ui/                 # Shadcn UI components

lib/
├── wordpress.ts        # WordPress API fetchers
├── types.ts           # TypeScript types
└── utils.ts           # Utility functions

public/
└── assets/
    └── hero.png        # Custom hero image
```

### WordPress Integration

**API Endpoint:** https://wp.cursedtours.com/wp-json/wp/v2

**Environment Variables:**
- `NEXT_PUBLIC_WORDPRESS_URL` - WordPress backend URL (default: https://wp.cursedtours.com)
- `NEXT_PUBLIC_SITE_URL` - Frontend site URL (default: https://www.cursedtours.com)
- `PREVIEW_SECRET` - Secret token for draft preview mode (optional)

**Content Stats:**
- 261 posts
- 8 categories
- 100 tags

**Data Fetching & Caching:**
- Server-side fetching with ISR (Incremental Static Regeneration)
- Default revalidation: 300 seconds (5 minutes)
- Slug enumeration revalidation: 3600 seconds (1 hour)
- Cache tags support for targeted revalidation
- Embedded data for authors, media, and taxonomies
- Utility functions for extracting post metadata

**Static Generation:**
- `generateStaticParams` for post pages via `getAllPostSlugs()`
- `generateStaticParams` for category pages via `getAllCategorySlugs()`
- `dynamicParams = true` enables blocking fallback for new content

**Preview Mode:**
- `/api/preview?secret=TOKEN&slug=SLUG&type=post` - Enable draft mode
- `/api/preview/exit` - Disable draft mode and return to home

### Deployment

**Target Platform:** Vercel (user preference)

The app is configured for Vercel deployment with:
- `next.config.mjs` - Image optimization for WordPress media
- Server components with async data fetching
- Automatic ISR (Incremental Static Regeneration)

**To deploy on Vercel:**
1. Push to GitHub repository
2. Import project in Vercel dashboard
3. Deploy (no configuration needed - Vercel auto-detects Next.js)

### Development

**Run locally:**
```bash
npm run dev
```

The app runs via a custom Express server that integrates Next.js, serving on port 5000.

### Design System

**Colors (Purple Theme - December 2025):**
- Primary: Purple (HSL 270 70% 55% light / 270 80% 65% dark)
- Accent: Complementary purple tints
- Dark mode: Deep purple-tinted backgrounds (270 15% 6%)

**Typography (2025 Best Practices):**
- UI/Headings: Inter (variable font, preloaded, with font-feature-settings)
- Article Body: Lora (serif for readability, preloaded)
- Code: JetBrains Mono (loaded on-demand)
- All fonts use `display: 'swap'` for faster initial render
- Proper fallback stacks for each font family

**Components:**
- Rounded-3xl corners
- Glassmorphism effects on cards
- Subtle shadows and borders
- Purple gradient and glow utility classes available

### Performance Optimizations (December 2025)

**Image Optimization:**
- Hero image uses `priority` for LCP optimization
- All other images use `loading="lazy"`
- Proper `sizes` attributes for responsive images
- `bg-muted` placeholder backgrounds prevent CLS
- 1-day minimum cache TTL for optimized images (86400 seconds)
- Custom device sizes: 640, 750, 828, 1080, 1200, 1920
- Custom image sizes: 16, 32, 48, 64, 96, 128, 256, 384

**Allowed Image Domains (next.config.mjs):**
- wp.cursedtours.com (WordPress backend)
- cursedtours.com, www.cursedtours.com, cms.cursedtours.com
- Jetpack CDN: i0.wp.com, i1.wp.com, i2.wp.com, i3.wp.com
- WordPress.com: s0.wp.com, s1.wp.com, s2.wp.com
- secure.gravatar.com (author avatars)
- images.unsplash.com (stock photos)

**DNS Prefetch & Preconnect (app/layout.tsx):**
- `dns-prefetch` and `preconnect` to wp.cursedtours.com
- `dns-prefetch` and `preconnect` to fonts.googleapis.com
- `dns-prefetch` and `preconnect` to fonts.gstatic.com

**Security Headers (vercel.json):**
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

**Static Asset Caching (vercel.json):**
- `/_next/static/*`: 1 year, immutable
- `/fonts/*`: 1 year, immutable
- `/images/*`: 1 day with stale-while-revalidate (7 days)

**Loading States:**
- Skeleton components for all routes (home, category, post, search)
- `loading.tsx` files for streaming SSR

**Mobile Accessibility:**
- Mobile search uses accessible Dialog component (not blocking prompt)
- DialogDescription for screen readers
- Minimum 44px touch targets

**Article Typography:**
- `.wp-content` class wrapper for WordPress content
- Lora serif font applied with high CSS specificity
- Purple link colors in article content

### Cloudflare Configuration (December 2025)

**Zone ID:** 449b52787cd1ea43af61523ea8251249

**Optimized Settings:**
- Development Mode: OFF (caching enabled)
- Rocket Loader: OFF (prevents React/Next.js issues)
- SSL Mode: Strict (validates Vercel certificate)
- Min TLS Version: 1.2 (security best practice)
- HSTS: Enabled (1 year max-age, include subdomains)
- Brotli Compression: ON
- Early Hints (103): ON
- HTTP/2: ON
- HTTP/3 (QUIC): ON
- Always Use HTTPS: ON
- Automatic HTTPS Rewrites: ON
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 2 hours
- Cache Level: Aggressive

### Production Deployment

**Health Check:**
- `/api/health` endpoint returns immediate 200 response
- Does not perform any database or external API calls
- Used for deployment health checks

**Build Process:**
- `npm run build` runs Next.js build then bundles Express server
- Production artifacts: `.next/` folder and `dist/index.cjs`
- `npm run start` runs the production server

### Testing

**Test Framework:** Vitest with React Testing Library

**Run Tests:**
```bash
npx vitest run        # Run all tests once
npx vitest            # Watch mode
npx vitest --coverage # With coverage report
```

**Test Structure:**
```
tests/
├── setup.tsx                         # Test setup with mocks for Next.js
├── lib/
│   └── wordpress.test.ts             # WordPress utility tests (52 tests)
└── components/
    ├── post-card.test.tsx            # PostCard variants (14 tests)
    ├── hero-section.test.tsx         # HeroSection (12 tests)
    ├── header.test.tsx               # Header/search/mobile (15 tests)
    ├── category-nav.test.tsx         # CategoryNav active states (12 tests)
    ├── footer.test.tsx               # Footer links (22 tests)
    ├── pagination.test.tsx           # Pagination navigation (23 tests)
    └── loading-skeleton.test.tsx     # Skeleton components (24 tests)
```

**Test Coverage (174 tests total):**

1. **WordPress Utilities (52 tests)**
   - stripHtml, formatDate, getReadingTime
   - getFeaturedImage, getAuthor, getCategories_Post, getTags_Post
   - buildSeo with edge cases (missing OG images, empty excerpts, author avatars)
   - Data fetching: getPosts, getPost, getCategories, getCategoryBySlug
   - getAllPostSlugs, getAllCategorySlugs pagination
   - Error handling for API failures

2. **Component Tests (122 tests)**
   - PostCard: variants (default, featured, compact), links, images, accessibility
   - HeroSection: rendering, image loading, author display, categories
   - Header: search functionality, mobile menu, navigation links
   - CategoryNav: active state styling, URL generation
   - Footer: navigation links, social icons, copyright
   - Pagination: page navigation, ellipsis, URL params
   - Loading Skeletons: PostCard, Hero, Article skeleton variants

3. **E2E Tests (Playwright)**
   - Health endpoint (/api/health)
   - Homepage with hero, categories, post grid
   - Category navigation and filtering
   - Post detail pages
   - Search functionality
   - Theme toggle (dark/light mode)

**Key Test Utilities:**
- Mocks for next/navigation (usePathname, useRouter, useSearchParams)
- Mocks for next/image (renders standard img)
- Mocks for window.matchMedia (responsive testing)
