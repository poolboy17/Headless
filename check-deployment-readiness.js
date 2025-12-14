#!/usr/bin/env node

/**
 * Vercel Deployment Readiness Checker
 * Run this before deploying to identify potential issues
 */

const https = require('https');
const http = require('http');

const CHECKS = {
  wordpress_url: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.cursedtours.com',
  database_url: process.env.DATABASE_URL,
  openai_key: process.env.OPENAI_API_KEY,
  site_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cursedtours.com',
};

console.log('\n🔍 Cursed Tours - Vercel Deployment Readiness Check\n');
console.log('='.repeat(60));

// Check 1: Environment Variables
console.log('\n📋 ENVIRONMENT VARIABLES CHECK:');
console.log('-'.repeat(60));

const requiredVars = [
  { name: 'NEXT_PUBLIC_WORDPRESS_URL', value: CHECKS.wordpress_url, required: true },
  { name: 'DATABASE_URL', value: CHECKS.database_url, required: true },
  { name: 'OPENAI_API_KEY', value: CHECKS.openai_key, required: true },
  { name: 'NEXT_PUBLIC_SITE_URL', value: CHECKS.site_url, required: false },
];

let missingRequired = [];

requiredVars.forEach(({ name, value, required }) => {
  const status = value ? '✅' : (required ? '❌' : '⚠️');
  const displayValue = value
    ? (name.includes('KEY') || name.includes('PASSWORD') || name.includes('DATABASE_URL')
        ? value.substring(0, 10) + '...'
        : value)
    : 'NOT SET';

  console.log(`${status} ${name}: ${displayValue}`);

  if (required && !value) {
    missingRequired.push(name);
  }
});

if (missingRequired.length > 0) {
  console.log('\n❌ CRITICAL: Missing required environment variables:');
  missingRequired.forEach(v => console.log(`   - ${v}`));
  console.log('\n   These MUST be set in Vercel Dashboard → Settings → Environment Variables');
}

// Check 2: WordPress API Connectivity
console.log('\n🌐 WORDPRESS API CHECK:');
console.log('-'.repeat(60));

function checkUrl(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`✅ ${description}: ${res.statusCode} OK`);
        resolve(true);
      } else {
        console.log(`⚠️  ${description}: ${res.statusCode} ${res.statusMessage}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ ${description}: Request timeout (>10s)`);
      req.destroy();
      resolve(false);
    });
  });
}

async function runChecks() {
  const wpBaseUrl = CHECKS.wordpress_url;

  await checkUrl(`${wpBaseUrl}/wp-json/wp/v2/posts?per_page=1`, 'WordPress REST API - Posts');
  await checkUrl(`${wpBaseUrl}/wp-json/wp/v2/categories?per_page=1`, 'WordPress REST API - Categories');
  await checkUrl(`${wpBaseUrl}/wp-json/wp/v2/pages?per_page=1`, 'WordPress REST API - Pages');

  // Check 3: Database Connection
  console.log('\n💾 DATABASE CHECK:');
  console.log('-'.repeat(60));

  if (CHECKS.database_url) {
    try {
      const dbUrl = new URL(CHECKS.database_url);
      console.log(`✅ Database URL format valid`);
      console.log(`   Host: ${dbUrl.hostname}`);
      console.log(`   Database: ${dbUrl.pathname.substring(1)}`);

      if (!dbUrl.hostname.includes('neon')) {
        console.log('⚠️  Database host doesn\'t appear to be Neon (expected for this project)');
      }
    } catch (err) {
      console.log(`❌ Invalid DATABASE_URL format: ${err.message}`);
    }
  } else {
    console.log('❌ DATABASE_URL not set - database features will fail');
  }

  // Check 4: Build Configuration
  console.log('\n🔧 BUILD CONFIGURATION CHECK:');
  console.log('-'.repeat(60));

  const fs = require('fs');
  const path = require('path');

  // Check package.json
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    if (pkg.scripts && pkg.scripts['vercel-build']) {
      console.log(`✅ vercel-build script found: ${pkg.scripts['vercel-build']}`);
    } else {
      console.log(`⚠️  No vercel-build script - Vercel will use default build`);
    }

    if (pkg.dependencies && pkg.dependencies.next) {
      console.log(`✅ Next.js version: ${pkg.dependencies.next}`);
    }
  } catch (err) {
    console.log(`⚠️  Could not read package.json: ${err.message}`);
  }

  // Check next.config.mjs
  try {
    const configPath = path.join(__dirname, 'next.config.mjs');
    if (fs.existsSync(configPath)) {
      console.log(`✅ next.config.mjs exists`);
    } else {
      console.log(`⚠️  next.config.mjs not found`);
    }
  } catch (err) {
    console.log(`⚠️  Could not check next.config.mjs: ${err.message}`);
  }

  // Check vercel.json
  try {
    const vercelPath = path.join(__dirname, 'vercel.json');
    if (fs.existsSync(vercelPath)) {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
      console.log(`✅ vercel.json exists`);
      if (vercelConfig.framework === 'nextjs') {
        console.log(`✅ Framework set to: nextjs`);
      }
    } else {
      console.log(`⚠️  vercel.json not found (optional)`);
    }
  } catch (err) {
    console.log(`⚠️  Could not read vercel.json: ${err.message}`);
  }

  // Final Summary
  console.log('\n📊 DEPLOYMENT READINESS SUMMARY:');
  console.log('='.repeat(60));

  if (missingRequired.length === 0) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Missing required environment variables - deployment will fail');
    console.log('   Set these in Vercel Dashboard before deploying');
  }

  console.log('\n📝 NEXT STEPS:');
  console.log('-'.repeat(60));
  console.log('1. Fix any ❌ critical issues above');
  console.log('2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
  console.log('3. Add all required environment variables for Production, Preview, and Development');
  console.log('4. Trigger a new deployment or push to your git branch');
  console.log('5. Monitor build logs in Vercel Dashboard → Deployments');

  console.log('\n💡 Common Issues:');
  console.log('-'.repeat(60));
  console.log('- Build timeout: Your site has many pages, consider using more dynamic rendering');
  console.log('- Database errors: Ensure DATABASE_URL is set and Neon DB is active');
  console.log('- WordPress 404s: Check WordPress firewall/security isn\'t blocking Vercel IPs');
  console.log('- Image errors: Verify next.config.mjs has correct remotePatterns');

  console.log('\n');
}

runChecks().catch(console.error);
