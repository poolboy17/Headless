# Cursed Tours Background Worker

This is a **sidecar service** that runs separately from the Next.js frontend.

## What It Does

1. **Fetches tours from Viator API** - Pulls ghost/paranormal tours from configured destinations
2. **Generates enhanced content** - Optionally uses AI (OpenAI) to write atmospheric descriptions
3. **Pushes to WordPress** - Creates or updates tour posts/pages via WordPress REST API
4. **Triggers revalidation** - Notifies Vercel to refresh cached pages

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         REPLIT                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Background Worker (this folder)                         │    │
│  │  - Scheduled or Reserved VM deployment                   │    │
│  │  - Syncs Viator → WordPress                              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Pushes content
┌─────────────────────────────────────────────────────────────────┐
│  WordPress (wp.cursedtours.com)                                  │
│  - Stores all content                                            │
│  - REST API for read/write                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Fetches content
┌─────────────────────────────────────────────────────────────────┐
│  Vercel (Next.js Frontend)                                       │
│  - Serves pages with ISR                                         │
│  - Global CDN distribution                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Environment Variables

Required:
- `VIATOR_API_KEY` - Viator Partner API key
- `WP_USERNAME` - WordPress username
- `WP_APP_PASSWORD` - WordPress application password

Optional:
- `OPENAI_API_KEY` - For AI content generation
- `VERCEL_REVALIDATE_WEBHOOK` - To trigger ISR after updates
- `DEPLOYMENT_TYPE` - Set to "reserved-vm" for continuous running

## Running Locally

```bash
cd worker
npx tsx index.ts
```

## Deployment Options

### Option 1: Scheduled Deployment
Runs on a cron schedule (e.g., every 6 hours). Best for periodic syncs.

### Option 2: Reserved VM Deployment  
Always-on service that syncs continuously. Best if you need real-time updates.

## Files

- `index.ts` - Entry point, schedules sync jobs
- `viator-sync.ts` - Fetches and processes Viator tour data
- `wordpress-push.ts` - Publishes content to WordPress
- `content-generator.ts` - AI-powered content enhancement

## Configured Destinations

- 684 - New Orleans
- 28892 - Salem  
- 60763 - Savannah

Add more destination IDs in `index.ts` as needed.
