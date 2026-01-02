'use client';

import { useEffect, useState, useMemo } from 'react';
import { Clock, Star, ExternalLink, Loader2, Ghost, CheckCircle, Filter } from 'lucide-react';
import { getProductsByCity, formatPrice, formatLastVerified, type ViatorProduct } from '@/lib/viator-products';
import { tours as staticTours, tourTypes, getAffiliateUrl, type Tour } from '@/lib/tours';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Destination } from '@/lib/destinations';

interface DestinationToursIslandProps {
  destination: Destination;
  viatorUrl: string;
}

const VIATOR_PID = 'P00166886';
const TOURS_PER_PAGE = 6;

export function DestinationToursIsland({ destination, viatorUrl }: DestinationToursIslandProps) {
  const [liveProducts, setLiveProducts] = useState<ViatorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(TOURS_PER_PAGE);

  // Get static tours for this destination's city
  const cityStaticTours = destination.citySlug 
    ? staticTours.filter(t => t.cityId === destination.citySlug)
    : [];

  useEffect(() => {
    async function fetchProducts() {
      if (!destination.citySlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch more products to enable filtering
        const response = await getProductsByCity(destination.citySlug, { perPage: 50 });
        setLiveProducts(response.products);
      } catch (err) {
        console.error('Error fetching tours:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [destination.citySlug]);

  // Extract unique categories from live products
  const categories = useMemo(() => {
    if (liveProducts.length === 0) return [];
    
    const categoryMap = new Map<string, number>();
    liveProducts.forEach(p => {
      if (p.category) {
        categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + 1);
      }
    });
    
    // Sort by count descending
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [liveProducts]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return liveProducts;
    return liveProducts.filter(p => p.category === selectedCategory);
  }, [liveProducts, selectedCategory]);

  // Products to display (with pagination)
  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(TOURS_PER_PAGE);
  }, [selectedCategory]);

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
            {hasLiveProducts 
              ? `${filteredProducts.length} of ${liveProducts.length} tours${selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}`
              : hasStaticTours 
                ? `${cityStaticTours.length} tours available`
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

      {/* Category Filter Tabs */}
      {hasLiveProducts && categories.length > 1 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter by type</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="text-xs"
            >
              All ({liveProducts.length})
            </Button>
            {categories.map(({ name, count }) => (
              <Button
                key={name}
                variant={selectedCategory === name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(name)}
                className="text-xs"
              >
                {name} ({count})
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Live Products */}
      {hasLiveProducts && (
        <div className="mb-8">
          {selectedCategory === 'all' && (
            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Live availability from Viator
            </p>
          )}
          
          {filteredProducts.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No tours in this category.</p>
                <Button 
                  variant="link" 
                  onClick={() => setSelectedCategory('all')}
                  className="mt-2"
                >
                  Show all tours
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {displayedProducts.map((product) => (
                  <LiveProductCard key={product.productCode} product={product} />
                ))}
              </div>
              
              {/* Show More Button */}
              {hasMore && (
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(prev => prev + TOURS_PER_PAGE)}
                  >
                    Show More ({filteredProducts.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Static Tours (fallback) */}
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
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl border-border/50 hover:border-primary/30">
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

          <div className="absolute bottom-3 left-3 flex gap-2">
            {product.hasFreeCancellation && (
              <Badge className="bg-green-600/90 text-white border-0 text-[10px] uppercase tracking-wider">
                Free Cancellation
              </Badge>
            )}
            {product.category && (
              <Badge className="bg-primary/80 text-primary-foreground border-0 text-[10px] uppercase tracking-wider">
                {product.category}
              </Badge>
            )}
          </div>
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
  const tourType = tourTypes.find(t => t.id === tour.type);

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

          {tourType && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-primary/80 text-primary-foreground border-0 text-[10px] uppercase tracking-wider">
                {tourType.label}
              </Badge>
            </div>
          )}
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
