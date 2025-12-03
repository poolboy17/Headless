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

**Colors (Ncmaz-inspired):**
- Primary: Indigo (HSL 239 84% 67%)
- Secondary: Teal accents
- Dark mode: Neutral 900 backgrounds

**Typography:**
- Headings: Inter
- Body: Lora (serif for readability)
- Code: JetBrains Mono

**Components:**
- Rounded-3xl corners
- Glassmorphism effects on cards
- Subtle shadows and borders
