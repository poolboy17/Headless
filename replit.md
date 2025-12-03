# Cursed Tours - Headless WordPress Blog

## Overview

Cursed Tours is a modern, headless WordPress blog/magazine application focused on paranormal investigations and ghost stories. The application uses WordPress as a headless CMS, consuming data via the WordPress REST API, while the frontend is built as a Single Page Application (SPA) using React, TypeScript, and modern UI components.

The architecture separates content management (WordPress backend) from content presentation (React frontend), enabling a fast, responsive user experience with server-side caching and optimized data fetching.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools:**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server, providing fast HMR (Hot Module Replacement)
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query (React Query)** for server state management, data fetching, and caching

**UI Component System:**
- **Shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with custom theme configuration
- **Class Variance Authority (CVA)** for component variant management
- Design system inspired by **Ncmaz Next.js headless WordPress theme**
- Ncmaz design patterns: indigo primary color (HSL 239 84% 67%), teal secondary, rounded-3xl corners, glassmorphism effects
- Custom theme supporting both light and dark modes with persistent user preference

**State Management:**
- Server state managed through React Query with 5-minute cache TTL
- Client state handled via React hooks and context (ThemeProvider)
- No global state management library needed due to headless CMS architecture

**Typography:**
- Primary: Inter for headings and UI elements
- Secondary: Lora for article body text (optimal readability)
- Monospace: JetBrains Mono for code blocks

**Layout System:**
- Responsive design with mobile-first approach
- Container-based layouts (max-width constraints)
- Grid and flexbox for component composition
- Sticky header and category navigation

### Backend Architecture

**Server Framework:**
- **Express.js** with TypeScript for the Node.js server
- HTTP server creation via Node's `http` module
- Custom middleware for request logging and JSON parsing

**API Layer:**
- RESTful API endpoints that proxy requests to WordPress
- Server-side caching layer using in-memory Map with 5-minute TTL
- Endpoints for posts, categories, tags, single posts, and search functionality

**Development vs Production:**
- Development: Vite dev server with HMR through middleware mode
- Production: Static file serving from compiled dist directory
- Conditional Replit-specific plugins for development environment

**Build Process:**
- Client builds via Vite (SPA compilation)
- Server builds via esbuild (bundled with select dependencies)
- Dependency bundling strategy using allowlist to reduce syscalls

### Data Storage Solutions

**Content Management:**
- **WordPress** (hosted at cursedtours.com) serves as headless CMS
- WordPress REST API v2 for all content retrieval
- No database in the application itself - all content stored in WordPress

**Caching Strategy:**
- In-memory caching (Map-based) for WordPress API responses
- 5-minute TTL on cached data
- Cache keys based on API endpoint and query parameters

**Schema Definition:**
- Zod schemas for WordPress API response validation
- Type-safe data structures for Posts, Categories, Tags, Authors, and Media
- Drizzle ORM configured (though not actively used - likely for future user data)

### Authentication and Authorization

Currently, the application does not implement user authentication. There is skeleton code for a user system (storage.ts with IStorage interface), but it's not integrated into the application flow. This suggests potential future features for user accounts, but currently all content is publicly accessible.

### External Dependencies

**WordPress Integration:**
- **WordPress REST API v2** at cursedtours.com/wp-json/wp/v2
- Embedded data fetching (_embed parameter) for authors, media, and taxonomies
- WordPress serves all content including posts, categories, tags, and media

**UI Component Libraries:**
- **Radix UI** primitives for accessible, unstyled components
- **Lucide React** and **React Icons** for iconography
- **Embla Carousel** for carousel/slider functionality
- **cmdk** for command palette functionality

**Styling:**
- **Tailwind CSS** for utility-first CSS
- **PostCSS** with Autoprefixer for CSS processing
- Custom CSS variables for theming (defined in index.css)

**Development Tools:**
- **Replit-specific plugins** for development environment integration
- **TSX** for TypeScript execution in development
- **Drizzle Kit** for database schema management (configured but not actively used)

**Database Configuration:**
- **Drizzle ORM** configured with PostgreSQL dialect
- **Neon Database** serverless driver configured
- Currently not used in production flow - likely reserved for future features like user accounts, comments, or analytics

**Fonts:**
- **Google Fonts** for Inter and Lora typefaces
- Preconnect optimization for font loading performance

**Package Management:**
- NPM with lock file for dependency versioning
- ESM module system throughout the application