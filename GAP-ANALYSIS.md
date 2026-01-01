# CursedTours.com Gap Analysis
**Date:** January 1, 2026

## Executive Summary

The site has strong technical foundations but faces a significant **indexing gap** - only ~20 pages showing impressions out of 3,865 submitted URLs in the sitemap.

---

## Current State

### Indexing & Visibility
| Metric | Value | Target | Gap |
|--------|-------|--------|-----|
| URLs in Sitemap | 3,865 | 3,865 | ✅ |
| Pages with Impressions | ~20 | 3,000+ | ❌ Critical |
| Total Impressions (28d) | 33 | 1,000+ | ❌ Critical |
| Clicks (28d) | 0 | 50+ | ❌ Critical |
| Avg Position | 8.8 | <10 | ✅ |

### Technical SEO
| Item | Status | Notes |
|------|--------|-------|
| robots.txt (frontend) | ✅ Clean | Proper allow/disallow |
| robots.txt (wp backend) | ✅ Fixed today | Now blocks all crawlers |
| Sitemap | ✅ Functional | 3,865 clean URLs |
| Canonical URLs | ⚠️ Verify | Frontend takes precedence |
| Internal Linking | ⚠️ In Progress | SSR components implemented |
| Page Speed | ✅ Good | SEO 100%, Best Practices 96% |

### Known Issues Resolved Today
1. ✅ `wp.cursedtours.com` was being crawled by Google
2. ✅ Shortlinks (`?p=ID`) were being discovered via HTTP headers
3. ✅ MU plugin deployed to block WordPress backend crawling

---

## Critical Gaps

### 1. Indexing Rate (CRITICAL)
**Problem:** GSC shows 3,865 submitted but reports 0 indexed
**Likely Causes:**
- New site / Google still discovering
- Possible duplicate content signals from wp.cursedtours.com (now fixed)
- Pages may be "Discovered - currently not indexed"

**Actions:**
- [ ] Check GSC Page Indexing report for specific status
- [ ] Request indexing for high-priority pages
- [ ] Monitor over next 2-4 weeks post robots.txt fix

### 2. Zero Clicks
**Problem:** 33 impressions, 0 clicks in 28 days
**Likely Causes:**
- Low impressions overall
- Title/description may not be compelling
- Positions not in top 3 for most queries

**Actions:**
- [ ] Review title tags for click-worthiness
- [ ] Ensure meta descriptions are compelling
- [ ] Focus on getting more pages indexed first

### 3. Internal Linking Coverage
**Problem:** Unknown percentage of posts have internal links
**Actions:**
- [ ] Run internal link audit
- [ ] Ensure category/destination pages link to related posts
- [ ] Verify SSR internal linking components are deployed

---

## Wins

1. **Technical Foundation:** PageSpeed scores excellent
2. **Clean URLs:** All sitemap URLs are proper slugs
3. **Backend Isolation:** wp.cursedtours.com now blocked from crawlers
4. **Sitemap Complete:** All 3,865 posts represented
5. **Architecture:** Headless setup working correctly

---

## Priority Actions (Next 2 Weeks)

1. **Monitor Indexing:** Check GSC daily for indexing progress
2. **Submit Priority Pages:** Manually request indexing for top 50 posts
3. **Remove wp.cursedtours.com from GSC:** If it's a property, remove it
4. **Internal Linking Audit:** Verify all posts have 3+ internal links
5. **Content Quality Check:** Ensure posts aren't flagged as thin content

---

## KPIs to Track

| Metric | Current | 2-Week Target | 4-Week Target |
|--------|---------|---------------|---------------|
| Indexed Pages | ~20 | 500+ | 2,000+ |
| Impressions/day | 1-2 | 50+ | 200+ |
| Clicks/day | 0 | 5+ | 20+ |
| Avg Position | 8.8 | <8 | <6 |
