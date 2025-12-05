# DNS & Routing Architecture - Cursed Tours

## Overview Diagram

```
                                    INTERNET USERS
                                          |
                                          v
                    +---------------------------------------------+
                    |           CLOUDFLARE (DNS + CDN)            |
                    |         Zone: cursedtours.com               |
                    |         Zone ID: 449b52787cd1ea43af61523ea  |
                    +---------------------------------------------+
                              |                    |
              +---------------+                    +----------------+
              |                                                     |
              v                                                     v
    +-------------------+                               +-------------------+
    |   VERCEL (CDN)    |                               |  WORDPRESS HOST   |
    | cname.vercel-dns  |                               | wp.cursedtours.com|
    +-------------------+                               +-------------------+
              |                                                     |
              v                                                     v
    +-------------------+                               +-------------------+
    |   NEXT.JS APP     |  <---- REST API ---->         |   WORDPRESS CMS   |
    | www.cursedtours.  |      /wp-json/wp/v2           | wp.cursedtours.   |
    |      .com         |                               |      .com         |
    +-------------------+                               +-------------------+
```

## Nameservers (Managed by Cloudflare)

| Type | Value |
|------|-------|
| NS | `plato.ns.cloudflare.com` |
| NS | `sloan.ns.cloudflare.com` |

## DNS Records (Configured in Cloudflare)

### A/CNAME Records

| Type | Name | Value | Proxy | Purpose |
|------|------|-------|-------|---------|
| CNAME | `@` (root) | `cname.vercel-dns.com` | Orange (Proxied) | Root domain to Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | Orange (Proxied) | WWW subdomain to Vercel |
| CNAME/A | `wp` | WordPress host IP/CNAME | Orange (Proxied) | WordPress backend |

### TXT Records

| Name | Value | Purpose |
|------|-------|---------|
| `@` | `google-site-verification=...` | Google Search Console |
| `@` | `v=spf1 ...` | Email SPF (if configured) |

### CAA Records

| Name | Tag | Value | Purpose |
|------|-----|-------|---------|
| `@` | `issue` | `letsencrypt.org` | SSL certificate authority |

## Traffic Flow

### Frontend Requests (www.cursedtours.com)

```
User Browser
    |
    | 1. DNS Query: www.cursedtours.com
    v
Cloudflare DNS
    |
    | 2. Returns Cloudflare edge IP (proxied)
    v
Cloudflare Edge (CDN)
    |
    | 3. Cache check, WAF, optimizations
    | 4. If miss, forward to origin
    v
Vercel Edge Network
    |
    | 5. Next.js SSR/ISR
    v
Next.js Application
    |
    | 6. Fetch data from WordPress API
    v
wp.cursedtours.com/wp-json/wp/v2
```

### WordPress API Requests (wp.cursedtours.com)

```
Next.js Server (Vercel)
    |
    | 1. fetch('https://wp.cursedtours.com/wp-json/wp/v2/posts')
    v
Cloudflare DNS
    |
    | 2. Resolve wp.cursedtours.com
    v
Cloudflare Edge
    |
    | 3. Cache check (if cacheable)
    v
WordPress Server
    |
    | 4. Process API request
    | 5. Return JSON response
    v
Next.js Server
    |
    | 6. Render HTML with data
    v
User Browser
```

## Domain Routing Summary

| Domain | Destination | Purpose |
|--------|-------------|---------|
| `cursedtours.com` | Redirects to `www.cursedtours.com` | Canonical redirect |
| `www.cursedtours.com` | Vercel → Next.js app | Main frontend |
| `wp.cursedtours.com` | WordPress server | CMS backend & API |

## Cloudflare Settings (Optimized)

| Setting | Value | Reason |
|---------|-------|--------|
| SSL Mode | Strict | Validates Vercel certificate |
| Min TLS | 1.2 | Security best practice |
| HSTS | Enabled (1 year) | Force HTTPS |
| Development Mode | OFF | Enable caching |
| Rocket Loader | OFF | Breaks React hydration |
| Brotli | ON | Compression |
| HTTP/2 | ON | Performance |
| HTTP/3 (QUIC) | ON | Performance |
| Early Hints | ON | Performance |
| Browser Cache TTL | 4 hours | Balance freshness/speed |
| Edge Cache TTL | 2 hours | CDN caching |

## Vercel Configuration

| Setting | Value |
|---------|-------|
| Project | `headless` |
| Framework | Next.js (auto-detected) |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Domain | `www.cursedtours.com` (primary) |
| Domain | `cursedtours.com` (redirects to www) |

## Environment Variables (Vercel)

| Variable | Value | Scope |
|----------|-------|-------|
| `NEXT_PUBLIC_WORDPRESS_URL` | `https://wp.cursedtours.com` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://www.cursedtours.com` | Production |

## Security Headers (vercel.json)

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Cache Strategy

### Static Assets (Immutable)
- `/_next/static/*` → 1 year, immutable
- `/fonts/*` → 1 year, immutable

### Dynamic Content
- `/images/*` → 1 day, stale-while-revalidate (7 days)
- ISR pages → 5 minutes revalidation
- Sitemap → 1 hour revalidation

## Monitoring Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Health check (200 OK) |
| `/sitemap.xml` | SEO sitemap |
| `/robots.txt` | Crawler rules |

---

*Last updated: December 2025*
