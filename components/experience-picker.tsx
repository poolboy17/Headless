'use client';

import Link from 'next/link';
import { MapPin, ExternalLink, Star, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { cities, tours, tourTypes, getAffiliateUrl, type Tour } from '@/lib/tours';

interface ExperiencePickerProps {
  className?: string;
}

export function ExperiencePicker({ className }: ExperiencePickerProps) {
  // Show featured tours from different cities
  const featuredTours = [
    tours.find(t => t.cityId === 'new-orleans'),
    tours.find(t => t.cityId === 'savannah'),
    tours.find(t => t.cityId === 'salem'),
    tours.find(t => t.cityId === 'edinburgh'),
  ].filter(Boolean) as Tour[];

  return (
    <section id="tours" className={cn('py-12 md:py-16', className)}>
      <div className="text-center mb-10">
        <Badge className="mb-4 bg-primary/10 text-primary border-0 text-xs uppercase tracking-wider font-semibold" data-testid="badge-experience-picker">
          Find Your Adventure
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-experience-picker-title">
          Explore Haunted Destinations
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose a city to discover ghost tours, paranormal experiences, and haunted adventures
        </p>
      </div>

      {/* City Grid - Links to city pages */}
      <div className="mb-12">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Popular Destinations
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/tours/${city.id}`}
              className="group flex flex-col items-center p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all duration-200"
              data-testid={`link-city-${city.id}`}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm text-center group-hover:text-primary transition-colors">
                {city.label}
              </span>
              <span className="text-[10px] text-muted-foreground">{city.country}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Tours Preview */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Featured Tours
        </h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>

      {/* View More CTA */}
      <div className="text-center mt-8">
        <a
          href={getAffiliateUrl("https://www.viator.com/searchResults/all?text=haunted+ghost+tour")}
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          <Button variant="outline" size="lg" className="gap-2" data-testid="button-view-more-tours">
            Explore All Tours on Viator
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
        <p className="text-xs text-muted-foreground mt-3">
          Affiliate link - we may earn a commission at no extra cost to you
        </p>
      </div>
    </section>
  );
}

interface TourCardProps {
  tour: Tour;
}

function TourCard({ tour }: TourCardProps) {
  const city = cities.find((c) => c.id === tour.cityId);
  const tourType = tourTypes.find((t) => t.id === tour.type);
  const affiliateUrl = getAffiliateUrl(tour.viatorUrl);

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block group"
      data-testid={`card-tour-${tour.id}`}
    >
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl border-border/50 hover:border-primary/30">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <img
            src={tour.imageUrl}
            alt={tour.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Price Badge */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm font-bold border-0">
              From {tour.price}
            </Badge>
          </div>

          {/* Tour Type Badge */}
          {tourType && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-primary/90 text-primary-foreground border-0 text-[10px] uppercase tracking-wider">
                {tourType.label}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Location */}
          {city && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3" />
              {city.label}, {city.country}
            </div>
          )}

          {/* Title */}
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-3">
            {tour.title}
          </h4>

          {/* Meta */}
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

export default ExperiencePicker;
