# Vercel Deployment Guide for Cursed Tours

## Prerequisites Checklist

### 1. Required Environment Variables

You **MUST** set these in Vercel Dashboard → Your Project → Settings → Environment Variables:

#### Essential (Required for Build)
```bash
# WordPress Backend
NEXT_PUBLIC_WORDPRESS_URL=https://wp.cursedtours.com
NEXT_PUBLIC_SITE_URL=https://www.cursedtours.com

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# OpenAI (for internal linking & AI features)
OPENAI_API_KEY=sk-...
```

#### Optional (But Recommended)
```bash
# Viator Affiliate
NEXT_PUBLIC_VIATOR_PID=P00166886

# WordPress Admin (for image uploads, content sync)
WP_USERNAME=your-wp-admin-username
WP_APP_PASSWORD=your-wp-app-password

# Preview Mode
PREVIEW_SECRET=your-preview-secret

# Admin API
ADMIN_API_KEY=your-admin-api-key

# Cron Security
CRON_SECRET=your-cron-secret
```

### 2. Vercel Project Settings

#### Build & Development Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run vercel-build` (or leave as default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)
- **Node Version**: 18.x or higher

#### Root Directory
- Leave as `.` (root of repository)

### 3. Common Deployment Issues & Solutions

#### Issue 1: Build Fails with Database Connection Error

**Symptoms:**
```
Error: Database connection failed
Cannot connect to Neon database
```

**Solution:**
1. Ensure `DATABASE_URL` is set in Vercel environment variables
2. Verify your Neon database is active and accessible
3. Check that the database URL format is correct:
   ```
   postgresql://user:password@host.region.neon.tech/database?sslmode=require
   ```

#### Issue 2: WordPress API Timeout or 404

**Symptoms:**
```
Failed to fetch from WordPress
404 Not Found: https://wp.cursedtours.com/wp-json/wp/v2/...
```

**Solution:**
1. Verify WordPress site is accessible: `https://wp.cursedtours.com/wp-json/wp/v2/posts`
2. Ensure REST API is enabled in WordPress
3. Check for any WordPress firewall/security plugins blocking API access
4. Verify `NEXT_PUBLIC_WORDPRESS_URL` is set correctly (no trailing slash)

#### Issue 3: Function Execution Timeout

**Symptoms:**
```
FUNCTION_INVOCATION_TIMEOUT
Task timed out after 10.00 seconds
```

**Solution:**
1. Some pages fetch a lot of data at build time
2. Consider adding `export const dynamic = 'force-dynamic'` to slow pages
3. Or increase timeout in `vercel.json` (Pro plan required)

#### Issue 4: Image Optimization Errors

**Symptoms:**
```
Invalid src prop
Failed to load image from WordPress
```

**Solution:**
1. Verify all WordPress image URLs are HTTPS
2. Check `next.config.mjs` has correct `remotePatterns` for your WordPress domain
3. Ensure WordPress images are publicly accessible

#### Issue 5: Missing Environment Variables at Runtime

**Symptoms:**
```
process.env.DATABASE_URL is undefined
Cannot read property of undefined
```

**Solution:**
1. Variables starting with `NEXT_PUBLIC_` are available in browser
2. Server-only variables (like DATABASE_URL) must NOT have `NEXT_PUBLIC_` prefix
3. Redeploy after adding environment variables (Vercel doesn't auto-redeploy)

### 4. Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the repository: `poolboy17/Headless`

3. **Configure Environment Variables**
   - Click "Environment Variables"
   - Add all required variables from the checklist above
   - Make sure to select appropriate environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (3-5 minutes)
   - Check build logs for errors

5. **Verify Deployment**
   - Visit your Vercel URL
   - Check homepage loads
   - Test a few post pages
   - Verify images load correctly
   - Check category pages work

### 5. Post-Deployment Configuration

#### Custom Domain
1. Go to Project Settings → Domains
2. Add your domain: `www.cursedtours.com`
3. Update DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

#### Database Setup
If starting fresh, run migrations:
```bash
npm run db:push
```

Or if you need to sync WordPress data to database, use your sync scripts.

### 6. Monitoring & Debugging

#### Check Build Logs
- Vercel Dashboard → Deployments → Click on deployment → View Build Logs

#### Check Function Logs
- Vercel Dashboard → Deployments → Click on deployment → View Function Logs

#### Enable Vercel Analytics (Optional)
- Project Settings → Analytics → Enable

### 7. Performance Optimization

#### Edge Config (Optional - Pro Plan)
For faster WordPress data access, consider:
1. Using Vercel Edge Config for categories/menus
2. Caching WordPress responses in Vercel KV

#### ISR (Incremental Static Regeneration)
Already configured in your app:
- Homepage: 300s revalidation
- Posts: 300s revalidation
- Categories: 300s revalidation

## Troubleshooting Commands

### Test Build Locally (with Docker/proper network)
```bash
npm install
npm run vercel-build
```

### Check Environment Variables
```bash
# In Vercel Dashboard, or via CLI:
vercel env ls
```

### View Deployment Logs
```bash
vercel logs [deployment-url]
```

## Need Help?

If you encounter issues not covered here:
1. Check Vercel build logs for specific error messages
2. Verify all environment variables are set correctly
3. Test your WordPress API endpoints directly in browser
4. Check Neon database connection string is valid
5. Review Next.js 15 migration guide if upgrading from older version

## Common Next.js 15 Changes

Your app is using Next.js 15. Be aware:
- `next/font` requires internet access during build (Vercel handles this)
- Server Components are default (your app already uses this)
- Improved caching behavior (may need to adjust revalidation times)
