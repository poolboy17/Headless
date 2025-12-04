# Cursed Tours - Headless WordPress Blog

A modern, performant headless WordPress frontend built with Next.js 15, featuring server-side rendering, dynamic content fetching, and a polished UI/UX with animations.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI (shadcn/ui)
- **Icons**: Lucide React
- **CMS**: WordPress REST API (headless)
- **Deployment**: Vercel

## Features

- **Server-Side Rendering** - All pages are server-rendered for optimal SEO and performance
- **Dynamic Content** - Posts, pages, and categories fetched from WordPress REST API
- **Responsive Design** - Mobile-first approach with adaptive layouts
- **Dark Mode** - Full dark mode support with system preference detection
- **Animations** - Scroll-reveal animations, staggered post grids, smooth transitions
- **SEO Optimized** - Dynamic metadata, Open Graph tags, structured data
- **Loading States** - Skeleton loaders for improved perceived performance
- **Empty States** - Friendly fallback UI when no content is available

## Project Structure

```
├── app/
│   ├── page.tsx                 # Homepage with hero, trending, post grid
│   ├── layout.tsx               # Root layout with header, footer, back-to-top
│   ├── post/[slug]/page.tsx     # Individual post pages
│   ├── category/[slug]/page.tsx # Category archive pages
│   ├── search/page.tsx          # Search results page
│   ├── about-us/page.tsx        # Static About Us page
│   └── [slug]/page.tsx          # Dynamic WordPress pages route
├── components/
│   ├── animated-post-grid.tsx   # Staggered animation post grid
│   ├── back-to-top.tsx          # Floating scroll-to-top button
│   ├── category-nav.tsx         # Horizontal scrollable category navigation
│   ├── empty-state.tsx          # Empty state components
│   ├── footer.tsx               # Site footer with links
│   ├── header.tsx               # Site header with navigation
│   ├── hero-section.tsx         # Featured post hero section
│   ├── newsletter-cta.tsx       # Newsletter signup section
│   ├── post-card.tsx            # Post card component with tags
│   ├── scroll-reveal.tsx        # Intersection Observer animation wrapper
│   ├── search-dialog.tsx        # Search modal
│   ├── skeletons.tsx            # Loading skeleton components
│   ├── theme-toggle.tsx         # Dark/light mode toggle
│   └── trending-posts.tsx       # Trending posts section
├── lib/
│   ├── wordpress.ts             # WordPress API client
│   └── utils.ts                 # Utility functions
└── public/
    └── assets/                  # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- WordPress site with REST API enabled

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

The development server runs at `http://localhost:3000`.

## WordPress API Integration

The `lib/wordpress.ts` module provides functions for fetching content:

### Posts
- `getPosts(options)` - Fetch posts with pagination, category filter, search
- `getPost(slug)` - Fetch single post by slug
- `getStickyPosts()` - Fetch sticky/featured posts

### Categories
- `getCategories()` - Fetch all categories
- `getCategory(slug)` - Fetch single category by slug

### Pages
- `getPage(slug)` - Fetch WordPress page by slug
- `getPages()` - Fetch all published pages
- `getAllPageSlugs()` - Get all page slugs for routing

### Utilities
- `stripHtml(html)` - Remove HTML tags from content
- `getFeaturedImage(post, size)` - Extract featured image URL
- `formatDate(date)` - Format date strings
- `calculateReadingTime(content)` - Estimate reading time

## Components

### AnimatedPostGrid
Displays posts in a grid with staggered fade-in animations triggered by scroll.

```tsx
<AnimatedPostGrid posts={posts} staggerDelay={80} />
```

### CategoryNav
Horizontal scrollable category navigation with gradient fade indicators.

```tsx
<CategoryNav categories={categories} activeCategory={slug} />
```

### HeroSection
Featured post display with full-width image and overlay content.

```tsx
<HeroSection post={featuredPost} />
```

### TrendingPosts
Displays top 4 trending posts with rank badges.

```tsx
<TrendingPosts posts={trendingPosts} />
```

### NewsletterCTA
Mid-page newsletter signup section with gradient background.

```tsx
<NewsletterCTA />
```

### ScrollReveal
Wrapper component that animates children on scroll intersection.

```tsx
<ScrollReveal>
  <YourContent />
</ScrollReveal>
```

### Skeletons
Loading state components matching the layout of actual content.

```tsx
<HeroSkeleton />
<PostGridSkeleton count={6} />
<CategoryNavSkeleton />
```

### Empty States
Friendly fallback UI when no content is available.

```tsx
<NoPostsFound />
<NoSearchResults query="search term" />
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## WordPress Configuration

### Required
- REST API enabled (default in WordPress 5.0+)
- Pretty permalinks enabled
- Featured images on posts

### Recommended
- Yoast SEO or similar for metadata
- Image optimization plugin
- Caching plugin for API responses

### Pages
Create these pages in WordPress for footer links:
- `/contact-us` - Contact page
- `/privacy-policy` - Privacy policy
- `/terms-of-service` - Terms of service
- `/cookie-policy` - Cookie policy
- `/affiliate-disclosure` - Affiliate disclosure

## Performance

- **Force Dynamic Rendering** - Pages use `dynamic = 'force-dynamic'` to ensure fresh content
- **Image Optimization** - Next.js Image component with lazy loading
- **Revalidation** - API responses cached with 300-second revalidation
- **Code Splitting** - Automatic route-based code splitting

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
