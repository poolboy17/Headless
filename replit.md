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

**API Endpoint:** https://cursedtours.com/wp-json/wp/v2

**Content Stats:**
- 261 posts
- 8 categories
- 100 tags

**Data Fetching:**
- Server-side fetching with 5-minute revalidation
- Embedded data for authors, media, and taxonomies
- Utility functions for extracting post metadata

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
├── setup.tsx           # Test setup with mocks for Next.js
├── lib/
│   └── wordpress.test.ts   # WordPress utility tests
└── components/
    └── post-card.test.tsx  # Component tests
```

**Key Test Utilities:**
- WordPress utilities: stripHtml, formatDate, getReadingTime, getAuthor, etc.
- Component tests for PostCard with all variants (default, featured, compact)
- Mocks for next/navigation, next/image, and window.matchMedia
