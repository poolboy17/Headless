'use client';

import { useEffect, useState } from 'react';
import { Clock, Star, ExternalLink, Loader2, Ghost, CheckCircle } from 'lucide-react';
import { getProductsByCity, formatPrice, formatLastVerified, type ViatorProduct } from '@/lib/viator-products';
import { tours as staticTours, getAffiliateUrl, type Tour } from '@/lib/tours';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Destination } from '@/lib/destinations';

interface DestinationToursIslandProps {
  destination: Destination;
  viatorUrl: string;
}

const VIATOR_PID = 'P00166886';

export function DestinationToursIsland({ destination, viatorUrl }: DestinationToursIslandProps) {
  const [liveProducts, setLiveProducts] = useState<ViatorProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Get static tours for this destination's city
  const cityStaticTours = destination.citySlug 
    ? staticTours.filter(t => t.cityId === destination.citySlug).slice(0, 6)
    : [];

  useEffect(() => {
    async function fetchProducts() {
      // Only fetch if we have a citySlug that maps to our system
      if (!destination.citySlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getProductsByCity(destination.citySlug, { perPage: 6 });
        setLiveProducts(response.products);
      } catch (err) {
        console.error('Error fetching tours:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [destination.citySlug]);

  const hasLiveProducts = liveProducts.length > 0;
  const hasStaticTours = cityStaticTours.length > 0;
  const hasAnyTours = hasLiveProducts || hasStaticTours;

  if (loading) {
    return (
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Available Tours</h2>
        <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading available tours...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">Available Tours</h2>
          <p className="text-muted-foreground text-sm">
            {hasAnyTours 
              ? `${hasLiveProducts ? liveProducts.length : cityStaticTours.length} tours for ${destination.name}`
              : 'Browse tours on Viator'}
          </p>
        </div>
        <a
          href={viatorUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          <Button variant="outline" className="gap-2">
            View all on Viator
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </div>

      {/* Live Products (if available) */}
      {hasLiveProducts && (
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Live availability from Viator
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveProducts.map((product) => (
              <LiveProductCard key={product.productCode} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* Static Tours (fallback or additional) */}
      {!hasLiveProducts && hasStaticTours && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cityStaticTours.map((tour) => (
            <StaticTourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}

      {/* No tours available */}
      {!hasAnyTours && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Ghost className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              No tours currently available in our database. Check Viator for options.
            </p>
            <a
              href={viatorUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              <Button className="gap-2">
                Browse Tours on Viator
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

// Live product card (from Viator API)
function LiveProductCard({ product }: { product: ViatorProduct }) {
  const affiliateUrl = `${product.url}${product.url.includes('?') ? '&' : '?'}pid=${VIATOR_PID}`;

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block group"
    >
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl border-border/50 hover:border-primary/30 ring-2 ring-green-500/20">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {product.thumbnailUrl ? (
            <img
              src={product.thumbnailUrl}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
              <Ghost className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm font-bold border-0">
              {formatPrice(product.price, product.currency)}
            </Badge>
          </div>

          {product.hasFreeCancellation && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-green-600/90 text-white border-0 text-[10px] uppercase tracking-wider">
                Free Cancellation
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h4 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {product.title}
          </h4>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {product.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                {product.rating.toFixed(1)} ({product.reviewCount.toLocaleString()})
              </span>
            )}
            {product.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {product.duration}
              </span>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground">
              Verified: {formatLastVerified(product.lastVerified)}
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

// Static tour card (from lib/tours.ts)
function StaticTourCard({ tour }: { tour: Tour }) {
  const affiliateUrl = getAffiliateUrl(tour.viatorUrl);

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block group"
    >
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl border-border/50 hover:border-primary/30">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={tour.imageUrl}
            alt={tour.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm font-bold border-0">
              From {tour.price}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h4 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {tour.title}
          </h4>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {tour.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {tour.rating} ({tour.reviewCount.toLocaleString()})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {tour.duration}
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
