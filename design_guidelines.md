# Design Guidelines: Headless WordPress Blog/Magazine

## Design Approach
**Reference-Based Approach** - Drawing inspiration from modern blog/magazine platforms:
- **Medium**: Clean typography and reading experience
- **The Verge**: Bold featured content and card layouts
- **Substack**: Content-first navigation
- **Ghost**: Minimal, content-focused design

**Core Principle**: Prioritize content discoverability and reading experience. Create visual hierarchy that guides users from featured content to browsing archives.

---

## Typography System

**Primary Font**: Google Fonts - Inter (headings, UI)
**Secondary Font**: Georgia or Lora (article body text for better readability)

**Type Scale**:
- Hero Headlines: text-5xl to text-7xl, font-bold
- Post Titles (cards): text-2xl, font-semibold
- Article Headings: text-4xl (h1), text-3xl (h2), text-2xl (h3)
- Body Text: text-lg with leading-relaxed for articles
- Meta Info (author, date): text-sm, font-medium
- Category Labels: text-xs uppercase tracking-wide

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 to p-8
- Section spacing: py-12 to py-20
- Card gaps: gap-6 to gap-8
- Content margins: mb-4 to mb-6

**Container Widths**:
- Full layout: max-w-7xl
- Article content: max-w-3xl (optimal reading width ~65-75 characters)
- Grid sections: max-w-6xl

---

## Page Layouts

### Homepage

**Hero Section** (Large featured post):
- Full-width featured image with overlay gradient
- Post title, excerpt, author info, category badge overlaid on image
- Prominent "Read Article" CTA button with blurred background
- Height: 70vh on desktop, auto on mobile

**Featured Grid** (3-4 recent posts):
- 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Large thumbnail images (aspect-ratio-16/9)
- Post title, excerpt (2 lines), author avatar + name, date, category badge
- Hover state: subtle scale transform on image

**Category Navigation Bar**:
- Horizontal scrollable list of category pills
- Sticky position below header on scroll
- Active category highlighted

**Main Content Grid** (Recent posts):
- 2-column layout on desktop (grid-cols-1 lg:grid-cols-2)
- Card design: Image + title + excerpt + meta info
- Pagination at bottom

**Sidebar** (Desktop only, 1/3 width):
- Popular posts (compact list with small thumbnails)
- Category list with post counts
- Newsletter signup form

### Individual Post Page

**Article Header**:
- Full-width featured image (aspect-ratio-21/9)
- Category badge, title, author info, date, reading time
- Social share buttons

**Content Area**:
- Single column, max-w-3xl centered
- Generous line-height (leading-relaxed)
- Clear heading hierarchy
- Pull quotes styled with border-l-4 and larger text
- Code blocks with syntax highlighting
- Image captions in smaller, italic text

**Related Posts** (Bottom of article):
- 3-card grid of related content
- Similar styling to homepage cards

---

## Component Library

### Post Card (Primary)
- Featured image (16:9 ratio)
- Category badge (top-left of image)
- Title (2 lines max, text-2xl)
- Excerpt (3 lines max, text-base)
- Author avatar (rounded-full, w-10 h-10)
- Author name + date (text-sm)
- Read time indicator

### Post Card (Compact)
- Small thumbnail (w-20 h-20, square)
- Title only (text-base, 2 lines max)
- Date (text-xs)
- Horizontal layout

### Category Badge
- Rounded-full pill design
- Uppercase text (text-xs)
- Padding: px-3 py-1
- Positioned absolutely on image overlays

### Author Card
- Avatar (rounded-full)
- Name (font-semibold)
- Bio (text-sm, 2-3 lines)
- Social links (icon-only)

### Navigation Header
- Logo left, search icon, menu right
- Search expands to full-width overlay when activated
- Categories dropdown mega-menu
- Sticky on scroll with subtle shadow

### Footer
- 4-column grid: About, Categories, Recent Posts, Newsletter
- Social media icons
- Copyright info centered at bottom

### AnimatedPostGrid
- Grid layout with staggered fade-in animations
- Uses Intersection Observer to trigger animations on scroll
- Configurable stagger delay between cards (default: 100ms)
- Cards translate up 30px while fading in

### TrendingPosts
- Horizontal grid of 4 trending posts (sm:grid-cols-2 lg:grid-cols-4)
- Each card shows rank badge (1-4) with orange gradient
- Flame icon header with "Trending Now" title
- Compact card with thumbnail, title, and trending indicator

### NewsletterCTA
- Mid-page call-to-action section
- Gradient background (primary to secondary colors)
- Email input with subscribe button
- Centered layout with max-width constraint

### ScrollReveal
- Wrapper component for scroll-triggered animations
- Uses Intersection Observer with 0.1 threshold
- Fade-in with translateY animation
- Once triggered, animation does not repeat

### BackToTop
- Floating button fixed to bottom-right (bottom-6 right-6)
- Appears after scrolling 400px
- Smooth scroll to top on click
- Transition animation for show/hide states

### Skeletons
Loading state components that match actual content layout:
- **Skeleton**: Base component with pulse animation
- **PostCardSkeleton**: Matches PostCard layout
- **PostGridSkeleton**: Grid of PostCardSkeletons
- **HeroSkeleton**: Matches HeroSection layout
- **CategoryNavSkeleton**: Horizontal row of pill shapes
- **TrendingPostsSkeleton**: Matches TrendingPosts layout

### EmptyState
Friendly fallback UI components:
- **NoPostsFound**: When no posts exist in category
- **NoSearchResults**: When search returns no results
- Centered layout with icon, title, and description
- Muted colors, encouraging messaging

---

## Images

**Hero Image**: Large, high-quality featured post image spanning full viewport width. Should showcase the most important/recent article with dramatic visual impact.

**Post Thumbnails**: 16:9 aspect ratio images for all post cards. Should be eye-catching and representative of content.

**Article Images**: Full-width within content area (max-w-3xl), with proper spacing above/below.

**Author Avatars**: Circular profile photos throughout cards and article headers.

---

## Key UX Patterns

**Progressive Disclosure**: Homepage shows increasing detail - hero (max detail) → featured grid → main grid → compact sidebar
**Infinite Scroll**: Main post grid loads more on scroll (optional pagination fallback)
**Search Overlay**: Full-screen search with instant results, ESC to close
**Category Filtering**: Click category = filter posts, clear filter button visible
**Reading Progress**: Thin progress bar at top of article pages showing scroll position

---

## Responsive Behavior

**Desktop** (lg:): Full multi-column layouts, sidebar visible
**Tablet** (md:): 2-column grids, no sidebar
**Mobile**: Single column, stacked cards, simplified hero section

All touch targets minimum 44x44px. Generous tap areas on cards (entire card clickable).

---

## Animations

**Scroll Reveal**: Elements fade in and translate up when entering viewport
- Duration: 500ms
- Easing: ease-out
- Transform: translateY(20-30px) to none

**Staggered Grid**: Post cards animate sequentially
- Base delay: 80-100ms between items
- Same animation as scroll reveal

**Hover Effects**:
- Cards: subtle scale (1.02) and shadow increase
- Images: scale(1.05) with overflow hidden
- Buttons: background color shift, optional scale

**Transitions**:
- Color transitions: 200-300ms
- Transform transitions: 300-500ms
- Opacity transitions: 300-500ms

**Back to Top Button**:
- Fade in/out with translateY
- Show threshold: 400px scroll

---

## Category Navigation

Enhanced horizontal scrollable category pills:
- Gradient fade overlays on scroll edges
- Navigation chevron buttons appear when scrollable
- Active category highlighted with primary color
- Smooth scroll behavior
- Scroll position tracked for fade indicators