'use client';

import { ExternalLink, MapPin, Star, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ViatorTour {
  productCode: string;
  title: string;
  url: string;
  price: string;
  rating: number;
  reviewCount: number;
  thumbnailUrl?: string;
  destination?: string;
}

interface ViatorCTAProps {
  tour: ViatorTour | null;
  className?: string;
}

export function ViatorCTA({ tour, className = '' }: ViatorCTAProps) {
  if (!tour || !tour.url) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-br from-purple-900/20 to-slate-900/40 border-purple-500/30 overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Ghost/Tour Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-purple-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
              🔮 Experience It Yourself
            </p>
            
            {/* Tour Title */}
            <h3 className="font-bold text-lg text-white mb-2 line-clamp-2">
              {tour.title}
            </h3>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 mb-4">
              {tour.destination && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  {tour.destination}
                </span>
              )}
              {tour.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {tour.rating.toFixed(1)}
                  {tour.reviewCount > 0 && (
                    <span className="text-gray-400">({tour.reviewCount.toLocaleString()})</span>
                  )}
                </span>
              )}
              {tour.price && (
                <span className="font-semibold text-green-400">
                  From {tour.price}
                </span>
              )}
            </div>
            
            {/* CTA Button */}
            <a
              href={tour.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-block"
            >
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-full transition-all hover:scale-105"
              >
                Book This Tour
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
        
        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-700/50">
          Affiliate link – we may earn a commission at no extra cost to you.
        </p>
      </CardContent>
    </Card>
  );
}

// Default export for easy importing
export default ViatorCTA;
