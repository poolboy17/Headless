/**
 * Cursed Tours - Background Worker
 * 
 * This sidecar service handles:
 * 1. Syncing Viator tour data to WordPress
 * 2. AI-enhanced content generation (optional)
 * 3. Scheduled content updates
 * 
 * Deployment: Replit Reserved VM or Scheduled
 * The Next.js frontend deploys to Vercel separately.
 */

import { syncViatorToursToWordPress } from './viator-sync';
import { getWordPressStats } from './wordpress-push';

const SYNC_INTERVAL_MS = 1000 * 60 * 60 * 6; // 6 hours

async function main() {
  console.log('🔮 Cursed Tours Worker Starting...');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initial sync on startup
  await runSync();
  
  // Schedule recurring syncs (for Reserved VM deployment)
  // For Scheduled deployment, this file runs once and exits
  if (process.env.DEPLOYMENT_TYPE === 'reserved-vm') {
    console.log(`Scheduling sync every ${SYNC_INTERVAL_MS / 1000 / 60 / 60} hours`);
    setInterval(runSync, SYNC_INTERVAL_MS);
  }
}

async function runSync() {
  console.log('\n--- Starting Sync ---');
  console.log(`Time: ${new Date().toISOString()}`);
  
  try {
    // 1. Get current WordPress stats
    const stats = await getWordPressStats();
    console.log(`WordPress: ${stats.posts} posts, ${stats.tours} tours`);
    
    // 2. Sync Viator tours to WordPress
    const result = await syncViatorToursToWordPress({
      destinationIds: [
        '684',   // New Orleans
        '28892', // Salem
        '60763', // Savannah
      ],
      limit: 20,
      generateContent: true, // Use AI to enhance descriptions
    });
    
    console.log(`Synced: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);
    
    // 3. Trigger Vercel ISR revalidation (optional)
    if (result.created > 0 || result.updated > 0) {
      await triggerRevalidation();
    }
    
    console.log('--- Sync Complete ---\n');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function triggerRevalidation() {
  // Optionally call a Vercel webhook to revalidate pages
  // This ensures the frontend picks up new content immediately
  const webhookUrl = process.env.VERCEL_REVALIDATE_WEBHOOK;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, { method: 'POST' });
      console.log('Triggered Vercel revalidation');
    } catch (e) {
      console.warn('Revalidation webhook failed:', e);
    }
  }
}

main().catch(console.error);
