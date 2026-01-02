'use client';

import { useEffect, useState } from 'react';
import { Clock, Star, ExternalLink, Loader2, Ghost } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Destination } from '@/lib/destinations';

interface ViatorProduct {
  productCode: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  price: string;
  currency: string;
  rating: number;
  reviewCount: number;
  duration: string;
  webURL: string;
}

interface DestinationToursIslandProps {
  destination: Destination;
  viatorUrl: string;
}

const VIATOR_PID = 'P00166886';

export function DestinationToursIsland({ destination, viatorUrl }: DestinationToursIslandProps) {
  const [products, setProducts] = useState<ViatorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        // Fetch from our Viator API route
        const response = await fetch(
          `/api/viator?destination=${destination.viatorDestId}&query=${encodeURIComponent(destination.viatorSearchQuery)}&limit=6`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch tours');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching tours:', err);
        setError('Unable to load tours');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [destination.viatorDestId, destination.viatorSearchQuery]);

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
            {products.length > 0 
              ? `${products.length} tours found for ${destination.name}`
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

      {error || products.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Ghost className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-4">
              {error || 'No tours found in our database. Check Viator for available options.'}
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
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.productCode} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

interface ProductCardProps {
  product: ViatorProduct;
}

function ProductCard({ product }: ProductCardProps) {
  const affiliateUrl = product.webURL.includes('?') 
    ? `${product.webURL}&pid=${VIATOR_PID}` 
    : `${product.webURL}?pid=${VIATOR_PID}`;

  const formattedPrice = product.price
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: product.currency || 'USD',
      }).format(parseFloat(product.price))
    : null;

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
          
          {formattedPrice && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm font-bold border-0">
                From {formattedPrice}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h4 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {product.title}
          </h4>
          
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {product.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                {product.rating.toFixed(1)}
                {product.reviewCount > 0 && (
                  <span>({product.reviewCount.toLocaleString()})</span>
                )}
              </span>
            )}
            {product.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {product.duration}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
