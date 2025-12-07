/**
 * Viator API Sync Module
 * 
 * Fetches tours from Viator and prepares them for WordPress
 */

import { pushTourToWordPress, tourExistsInWordPress } from './wordpress-push';
import { generateTourContent } from './content-generator';

interface SyncOptions {
  destinationIds: string[];
  limit: number;
  generateContent: boolean;
}

interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface ViatorTour {
  productCode: string;
  title: string;
  description: string;
  duration: string;
  price: {
    amount: number;
    currency: string;
  };
  rating: number;
  reviewCount: number;
  images: Array<{ url: string }>;
  bookingUrl: string;
  destinationId: string;
}

export async function syncViatorToursToWordPress(options: SyncOptions): Promise<SyncResult> {
  const result: SyncResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const destinationId of options.destinationIds) {
    console.log(`Fetching tours for destination: ${destinationId}`);
    
    try {
      const tours = await fetchViatorTours(destinationId, options.limit);
      console.log(`Found ${tours.length} tours`);
      
      for (const tour of tours) {
        try {
          const exists = await tourExistsInWordPress(tour.productCode);
          
          if (exists && !shouldUpdate(tour)) {
            result.skipped++;
            continue;
          }
          
          // Optionally enhance content with AI
          let content = tour.description;
          if (options.generateContent) {
            content = await generateTourContent(tour);
          }
          
          const tourData = {
            productCode: tour.productCode,
            title: tour.title,
            content,
            excerpt: tour.description.substring(0, 200) + '...',
            duration: tour.duration,
            price: tour.price,
            rating: tour.rating,
            reviewCount: tour.reviewCount,
            featuredImage: tour.images[0]?.url,
            bookingUrl: tour.bookingUrl,
            destinationId: tour.destinationId,
          };
          
          await pushTourToWordPress(tourData, exists ? 'update' : 'create');
          
          if (exists) {
            result.updated++;
          } else {
            result.created++;
          }
          
          // Rate limit to avoid overwhelming APIs
          await sleep(500);
        } catch (error) {
          result.errors.push(`Tour ${tour.productCode}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Destination ${destinationId}: ${error}`);
    }
  }

  if (result.errors.length > 0) {
    console.warn('Sync errors:', result.errors);
  }

  return result;
}

async function fetchViatorTours(destinationId: string, limit: number): Promise<ViatorTour[]> {
  const apiKey = process.env.VIATOR_API_KEY;
  if (!apiKey) {
    throw new Error('VIATOR_API_KEY not configured');
  }

  const response = await fetch(
    `https://api.viator.com/partner/products/search`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json;version=2.0',
        'Content-Type': 'application/json',
        'exp-api-key': apiKey,
      },
      body: JSON.stringify({
        filtering: {
          destination: destinationId,
          tags: [21972], // Ghost & Vampire Tours tag
        },
        sorting: { sort: 'TRAVELER_RATING', order: 'DESC' },
        pagination: { start: 1, count: limit },
        currency: 'USD',
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Viator API error: ${response.status}`);
  }

  const data = await response.json();
  
  return (data.products || []).map((p: any) => ({
    productCode: p.productCode,
    title: p.title,
    description: p.description || '',
    duration: p.duration?.fixedDurationInMinutes 
      ? `${p.duration.fixedDurationInMinutes} minutes`
      : 'Varies',
    price: {
      amount: p.pricing?.summary?.fromPrice || 0,
      currency: 'USD',
    },
    rating: p.reviews?.combinedAverageRating || 0,
    reviewCount: p.reviews?.totalReviews || 0,
    images: p.images || [],
    bookingUrl: p.productUrl || '',
    destinationId,
  }));
}

function shouldUpdate(tour: ViatorTour): boolean {
  // Logic to determine if a tour needs updating
  // Could check last modified date, price changes, etc.
  return false; // For now, skip updates
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
