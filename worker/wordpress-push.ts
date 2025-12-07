/**
 * WordPress REST API Push Module
 * 
 * Publishes tour content to WordPress as custom post type or pages
 */

interface TourData {
  productCode: string;
  title: string;
  content: string;
  excerpt: string;
  duration: string;
  price: { amount: number; currency: string };
  rating: number;
  reviewCount: number;
  featuredImage?: string;
  bookingUrl: string;
  destinationId: string;
}

interface WordPressStats {
  posts: number;
  tours: number;
}

const WP_API = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.cursedtours.com';

function getAuthHeader(): string {
  const username = process.env.WP_USERNAME;
  const password = process.env.WP_APP_PASSWORD;
  
  if (!username || !password) {
    throw new Error('WordPress credentials not configured (WP_USERNAME, WP_APP_PASSWORD)');
  }
  
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

export async function getWordPressStats(): Promise<WordPressStats> {
  try {
    const [postsRes, toursRes] = await Promise.all([
      fetch(`${WP_API}/wp-json/wp/v2/posts?per_page=1`),
      fetch(`${WP_API}/wp-json/wp/v2/tours?per_page=1`).catch(() => null),
    ]);

    const postsTotal = parseInt(postsRes.headers.get('X-WP-Total') || '0', 10);
    const toursTotal = toursRes 
      ? parseInt(toursRes.headers.get('X-WP-Total') || '0', 10)
      : 0;

    return { posts: postsTotal, tours: toursTotal };
  } catch (error) {
    console.warn('Could not fetch WordPress stats:', error);
    return { posts: 0, tours: 0 };
  }
}

export async function tourExistsInWordPress(productCode: string): Promise<boolean> {
  try {
    // Check if a tour with this product code exists (via custom meta or slug)
    const response = await fetch(
      `${WP_API}/wp-json/wp/v2/tours?slug=tour-${productCode}&per_page=1`
    );
    
    if (!response.ok) {
      // Tours CPT might not exist, check pages instead
      const pagesRes = await fetch(
        `${WP_API}/wp-json/wp/v2/pages?slug=tour-${productCode}&per_page=1`
      );
      const pages = await pagesRes.json();
      return pages.length > 0;
    }
    
    const tours = await response.json();
    return tours.length > 0;
  } catch {
    return false;
  }
}

export async function pushTourToWordPress(
  tour: TourData, 
  mode: 'create' | 'update'
): Promise<void> {
  const slug = `tour-${tour.productCode}`;
  
  // Build structured content with tour details
  const structuredContent = buildTourPageContent(tour);
  
  const postData = {
    title: tour.title,
    slug,
    content: structuredContent,
    excerpt: tour.excerpt,
    status: 'publish',
    meta: {
      viator_product_code: tour.productCode,
      tour_duration: tour.duration,
      tour_price: tour.price.amount,
      tour_currency: tour.price.currency,
      tour_rating: tour.rating,
      tour_review_count: tour.reviewCount,
      tour_booking_url: tour.bookingUrl,
      tour_destination_id: tour.destinationId,
    },
  };

  // Try custom post type first, fall back to pages
  let endpoint = `${WP_API}/wp-json/wp/v2/tours`;
  
  if (mode === 'update') {
    // Find existing post ID
    const existingId = await getExistingPostId(slug);
    if (existingId) {
      endpoint = `${WP_API}/wp-json/wp/v2/tours/${existingId}`;
    }
  }

  const response = await fetch(endpoint, {
    method: mode === 'create' ? 'POST' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    // If tours CPT doesn't exist, try pages
    if (response.status === 404) {
      await pushTourAsPage(tour, mode);
      return;
    }
    
    const error = await response.text();
    throw new Error(`WordPress API error: ${response.status} - ${error}`);
  }

  console.log(`${mode === 'create' ? 'Created' : 'Updated'} tour: ${tour.title}`);
}

async function pushTourAsPage(tour: TourData, mode: 'create' | 'update'): Promise<void> {
  const slug = `tour-${tour.productCode}`;
  const structuredContent = buildTourPageContent(tour);
  
  const pageData = {
    title: tour.title,
    slug,
    content: structuredContent,
    excerpt: tour.excerpt,
    status: 'publish',
  };

  let endpoint = `${WP_API}/wp-json/wp/v2/pages`;
  
  if (mode === 'update') {
    const existingId = await getExistingPostId(slug, 'pages');
    if (existingId) {
      endpoint = `${WP_API}/wp-json/wp/v2/pages/${existingId}`;
    }
  }

  const response = await fetch(endpoint, {
    method: mode === 'create' ? 'POST' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify(pageData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WordPress API error: ${response.status} - ${error}`);
  }
}

async function getExistingPostId(slug: string, type: string = 'tours'): Promise<number | null> {
  try {
    const response = await fetch(
      `${WP_API}/wp-json/wp/v2/${type}?slug=${slug}&per_page=1`
    );
    const posts = await response.json();
    return posts[0]?.id || null;
  } catch {
    return null;
  }
}

function buildTourPageContent(tour: TourData): string {
  // Build WordPress Gutenberg-compatible HTML
  return `
<!-- wp:group {"className":"tour-details"} -->
<div class="wp-block-group tour-details">

<!-- wp:paragraph {"className":"tour-meta"} -->
<p class="tour-meta">
  <strong>Duration:</strong> ${tour.duration} | 
  <strong>From:</strong> ${tour.price.currency} $${tour.price.amount.toFixed(2)} |
  <strong>Rating:</strong> ${tour.rating.toFixed(1)}/5 (${tour.reviewCount} reviews)
</p>
<!-- /wp:paragraph -->

<!-- wp:separator -->
<hr class="wp-block-separator"/>
<!-- /wp:separator -->

${tour.content}

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"className":"book-now-button"} -->
<div class="wp-block-button book-now-button">
  <a class="wp-block-button__link" href="${tour.bookingUrl}" target="_blank" rel="noopener">
    Book This Tour
  </a>
</div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->

</div>
<!-- /wp:group -->
`.trim();
}
