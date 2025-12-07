'use client';

import { useEffect, useState } from 'react';
import { Clock, Star, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getProductsByCity, formatPrice, formatLastVerified, type ViatorProduct } from '@/lib/viator-products';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductImageGallery } from '@/components/product-image-gallery';

interface ViatorProductsIslandProps {
  citySlug: string;
  viatorCityUrl: string;
}

export function ViatorProductsIsland({ citySlug, viatorCityUrl }: ViatorProductsIslandProps) {
  const [products, setProducts] = useState<ViatorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await getProductsByCity(citySlug, { perPage: 12 });
        setProducts(response.products);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Unable to load live tour data');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [citySlug]);

  if (loading) {
    return (
      <div className="py-12">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading available tours...</span>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h3 className="text-xl font-bold mb-1">Live Tours from Viator</h3>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            {products.length} {products.length === 1 ? 'tour' : 'tours'} with real-time availability
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="w-3 h-3" />
              Live data
            </span>
          </p>
        </div>
        <a
          href={viatorCityUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          <Button variant="outline" className="gap-2" data-testid="button-view-all-viator-live">
            View all on Viator
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <LiveProductCard key={product.productCode} product={product} />
        ))}
      </div>
    </div>
  );
}

interface LiveProductCardProps {
  product: ViatorProduct;
}

function LiveProductCard({ product }: LiveProductCardProps) {
  const VIATOR_PID = process.env.NEXT_PUBLIC_VIATOR_PID || 'P00166886';
  const affiliateUrl = `${product.url}${product.url.includes('?') ? '&' : '?'}pid=${VIATOR_PID}`;

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block group"
      data-testid={`card-live-product-${product.productCode}`}
    >
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl border-border/50 hover:border-primary/30 ring-2 ring-green-500/20">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <ProductImageGallery product={product} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute top-3 right-3 pointer-events-none">
            <Badge className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm font-bold border-0">
              {formatPrice(product.price, product.currency)}
            </Badge>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-none">
            {product.hasFreeCancellation && (
              <Badge className="bg-green-600/90 text-white border-0 text-[10px] uppercase tracking-wider">
                Free Cancellation
              </Badge>
            )}
            {product.isActive ? (
              <Badge className="bg-primary/90 text-primary-foreground border-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Available
              </Badge>
            ) : (
              <Badge className="bg-yellow-600/90 text-white border-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Check Availability
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
