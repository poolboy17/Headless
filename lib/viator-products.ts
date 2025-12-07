// Viator Products API - fetches from WordPress database
// Products are synced daily from Viator API via WordPress cron

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.cursedtours.com';
const VIATOR_PID = process.env.NEXT_PUBLIC_VIATOR_PID || 'P00166886';

export interface ViatorProduct {
  productCode: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  price: string;
  currency: string;
  rating: number;
  reviewCount: number;
  duration: string;
  destinationId: string;
  destinationName: string;
  category: string;
  isActive: boolean;
  hasFreeCancellation: boolean;
  lastVerified: string;
}

export interface ProductsResponse {
  products: ViatorProduct[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

export interface SyncStatus {
  lastSync: string | null;
  nextScheduledSync: string | null;
  totalProducts: number;
  activeProducts: number;
  destinations: Array<{
    destination_id: string;
    destination_name: string;
    count: number;
  }>;
}

// Destination ID to city slug mapping
export const DESTINATION_MAP: Record<string, string> = {
  '675': 'new-orleans',
  '737': 'london',
  '739': 'edinburgh',
  '4283': 'savannah',
  '50249': 'salem',
  '673': 'chicago',
  '687': 'new-york',
  '678': 'boston',
  '22093': 'gettysburg',
  '4282': 'st-augustine',
  '4177': 'san-antonio',
  '684': 'paris',
  '503': 'dublin',
};

// City slug to destination ID mapping
export const CITY_TO_DESTINATION: Record<string, string> = Object.fromEntries(
  Object.entries(DESTINATION_MAP).map(([destId, citySlug]) => [citySlug, destId])
);

/**
 * Get all products from WordPress
 */
export async function getProducts(options: {
  destination?: string;
  activeOnly?: boolean;
  perPage?: number;
  page?: number;
} = {}): Promise<ProductsResponse> {
  const { destination, activeOnly = true, perPage = 50, page = 1 } = options;
  
  const params = new URLSearchParams({
    active_only: activeOnly.toString(),
    per_page: perPage.toString(),
    page: page.toString(),
  });
  
  if (destination) {
    params.set('destination', destination);
  }
  
  try {
    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/viator-sync/v1/products?${params}`,
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Viator products:', error);
    return {
      products: [],
      pagination: { total: 0, per_page: perPage, current_page: page, total_pages: 0 },
    };
  }
}

/**
 * Get products for a specific city
 */
export async function getProductsByCity(
  citySlug: string,
  options: { perPage?: number; page?: number } = {}
): Promise<ProductsResponse> {
  const destinationId = CITY_TO_DESTINATION[citySlug];
  
  if (!destinationId) {
    console.warn(`Unknown city slug: ${citySlug}`);
    return {
      products: [],
      pagination: { total: 0, per_page: options.perPage || 50, current_page: options.page || 1, total_pages: 0 },
    };
  }
  
  return getProducts({
    destination: destinationId,
    ...options,
  });
}

/**
 * Get a single product by code
 */
export async function getProduct(productCode: string): Promise<ViatorProduct | null> {
  try {
    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/viator-sync/v1/products/${productCode}`,
      {
        next: { revalidate: 300 },
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch product: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Viator product:', error);
    return null;
  }
}

/**
 * Get sync status from WordPress
 */
export async function getSyncStatus(): Promise<SyncStatus | null> {
  try {
    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/viator-sync/v1/status`,
      {
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sync status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return null;
  }
}

/**
 * Format price with currency
 */
export function formatPrice(price: string, currency: string = 'USD'): string {
  if (!price) return '';
  
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) return price;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(numericPrice);
}

/**
 * Format the last verified date for display
 */
export function formatLastVerified(dateString: string): string {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

/**
 * Build schema.org Product structured data for SEO
 */
export function buildProductSchema(product: ViatorProduct): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.thumbnailUrl,
    url: product.url,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.isActive
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      validFrom: product.lastVerified,
    },
    aggregateRating: product.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    brand: {
      '@type': 'Organization',
      name: 'Viator',
    },
    category: product.category || 'Tours & Activities',
  };
}

/**
 * Check if products API is available
 */
export async function isProductsApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/viator-sync/v1/status`,
      {
        method: 'HEAD',
        next: { revalidate: 3600 },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}
