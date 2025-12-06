'use client';

import { useState } from 'react';
import { MapPin, Footprints, Bus, Ghost, Moon, Castle, ChevronRight, ExternalLink, Star, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Tour types
const tourTypes = [
  { id: 'walking', label: 'Walking Tours', icon: Footprints, description: 'Explore haunted streets on foot' },
  { id: 'bus', label: 'Bus Tours', icon: Bus, description: 'Cover more ground in comfort' },
  { id: 'ghost-hunt', label: 'Ghost Hunts', icon: Ghost, description: 'Interactive paranormal investigations' },
  { id: 'night', label: 'Night Tours', icon: Moon, description: 'Experience the darkness' },
];

// Locations - ordered by popularity
const locations = [
  { id: 'new-orleans', label: 'New Orleans', country: 'USA', viatorDest: 'd675' },
  { id: 'london', label: 'London', country: 'UK', viatorDest: 'd737' },
  { id: 'edinburgh', label: 'Edinburgh', country: 'UK', viatorDest: 'd739' },
  { id: 'savannah', label: 'Savannah', country: 'USA', viatorDest: 'd4283' },
  { id: 'salem', label: 'Salem', country: 'USA', viatorDest: 'd50249' },
  { id: 'chicago', label: 'Chicago', country: 'USA', viatorDest: 'd673' },
  { id: 'new-york', label: 'New York', country: 'USA', viatorDest: 'd687' },
  { id: 'boston', label: 'Boston', country: 'USA', viatorDest: 'd678' },
  { id: 'gettysburg', label: 'Gettysburg', country: 'USA', viatorDest: 'd22093' },
  { id: 'st-augustine', label: 'St. Augustine', country: 'USA', viatorDest: 'd4282' },
  { id: 'charleston', label: 'Charleston', country: 'USA', viatorDest: 'd4384' },
  { id: 'dublin', label: 'Dublin', country: 'Ireland', viatorDest: 'd503' },
];

// Curated tours with Viator search URLs - these reliably show bookable tours
// Using destination search URLs ensures users always land on pages with real tours
const curatedTours: Tour[] = [
  {
    id: '1',
    title: 'New Orleans Haunted Walking Tours',
    location: 'new-orleans',
    type: 'walking',
    price: 'From $25',
    rating: 4.8,
    reviewCount: 2450,
    duration: '1.5-2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/New-Orleans/d675-ttd/g21-Walking-Tours?tag1=21&tag2=11292',
  },
  {
    id: '2',
    title: 'New Orleans Ghost Bus Tours',
    location: 'new-orleans',
    type: 'bus',
    price: 'From $35',
    rating: 4.7,
    reviewCount: 1890,
    duration: '2-2.5 hours',
    groupSize: 'Group tour',
    imageUrl: 'https://images.unsplash.com/photo-1509128841709-6c13b25058a3?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/New-Orleans/d675-ttd/g6-Ghost-and-Vampire-Tours',
  },
  {
    id: '3',
    title: 'Savannah Ghost Walking Tours',
    location: 'savannah',
    type: 'walking',
    price: 'From $20',
    rating: 4.9,
    reviewCount: 3200,
    duration: '1.5-2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1596394723269-b2cbca4e6313?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Savannah/d4283-ttd/g6-Ghost-and-Vampire-Tours',
  },
  {
    id: '4',
    title: 'Salem Witch City Tours',
    location: 'salem',
    type: 'night',
    price: 'From $25',
    rating: 4.8,
    reviewCount: 1567,
    duration: '1.5-2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Salem/d50249-ttd/g6-Ghost-and-Vampire-Tours',
  },
  {
    id: '5',
    title: 'Edinburgh Underground Ghost Tours',
    location: 'edinburgh',
    type: 'ghost-hunt',
    price: 'From $15',
    rating: 4.7,
    reviewCount: 2890,
    duration: '1-2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1594732832278-abd644401426?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Edinburgh/d739-ttd/g6-Ghost-and-Vampire-Tours',
  },
  {
    id: '6',
    title: 'London Jack the Ripper Tours',
    location: 'london',
    type: 'walking',
    price: 'From $15',
    rating: 4.6,
    reviewCount: 4560,
    duration: '2 hours',
    groupSize: 'Group tour',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/searchResults/all?text=jack+the+ripper+london&destId=737',
  },
  {
    id: '7',
    title: 'Gettysburg Battlefield Ghost Tours',
    location: 'gettysburg',
    type: 'night',
    price: 'From $20',
    rating: 4.8,
    reviewCount: 1234,
    duration: '1.5-2 hours',
    groupSize: 'Small group',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/Gettysburg/d22093-ttd/g6-Ghost-and-Vampire-Tours',
  },
  {
    id: '8',
    title: 'St. Augustine Ghost Tours',
    location: 'st-augustine',
    type: 'bus',
    price: 'From $25',
    rating: 4.7,
    reviewCount: 987,
    duration: '1.5-2 hours',
    groupSize: 'Group tour',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    viatorUrl: 'https://www.viator.com/St-Augustine/d4282-ttd/g6-Ghost-and-Vampire-Tours',
  },
];

interface Tour {
  id: string;
  title: string;
  location: string;
  type: string;
  price: string;
  rating: number;
  reviewCount: number;
  duration: string;
  groupSize: string;
  imageUrl: string;
  viatorUrl: string;
}

interface ExperiencePickerProps {
  className?: string;
}

// Viator affiliate Partner ID
const VIATOR_PID = 'P00166886';

// Helper to append affiliate PID to Viator URLs
function getAffiliateUrl(baseUrl: string): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}pid=${VIATOR_PID}`;
}

export function ExperiencePicker({ className }: ExperiencePickerProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Filter tours based on selection
  const filteredTours = curatedTours.filter((tour) => {
    if (selectedType && tour.type !== selectedType) return false;
    if (selectedLocation && tour.location !== selectedLocation) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedType(null);
    setSelectedLocation(null);
  };

  const hasFilters = selectedType || selectedLocation;

  return (
    <section className={cn('py-12 md:py-16', className)}>
      <div className="text-center mb-10">
        <Badge className="mb-4 bg-primary/10 text-primary border-0 text-xs uppercase tracking-wider font-semibold" data-testid="badge-experience-picker">
          Find Your Adventure
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-experience-picker-title">
          Pick Your Paranormal Experience
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover haunted tours and ghost hunting experiences tailored to your preferences
        </p>
      </div>

      {/* Location Selection - Primary Filter */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Choose your destination
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {locations.map((location) => {
            const isSelected = selectedLocation === location.id;
            return (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(isSelected ? null : location.id)}
                className={cn(
                  'group flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
                )}
                data-testid={`button-location-${location.id}`}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                )}>
                  <MapPin className="w-5 h-5" />
                </div>
                <span className={cn(
                  'font-semibold text-xs text-center',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}>
                  {location.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{location.country}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tour Type Selection - Secondary Filter */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          What kind of experience?
        </h3>
        <div className="flex flex-wrap gap-2">
          {tourTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(isSelected ? null : type.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                )}
                data-testid={`button-tour-type-${type.id}`}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTours.length} {filteredTours.length === 1 ? 'tour' : 'tours'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Tour Results */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {filteredTours.slice(0, 8).map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>

      {filteredTours.length === 0 && (
        <div className="text-center py-12">
          <Ghost className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No tours match your selection</p>
          <Button variant="ghost" onClick={clearFilters} className="mt-2" data-testid="button-clear-filters-empty">
            Clear filters to see all tours
          </Button>
        </div>
      )}

      {/* View More CTA */}
      {filteredTours.length > 0 && (
        <div className="text-center mt-8">
          <a
            href={getAffiliateUrl("https://www.viator.com/searchResults/all?text=haunted+ghost+tour")}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            <Button variant="outline" size="lg" className="gap-2" data-testid="button-view-more-tours">
              Explore More Tours on Viator
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-3">
            Affiliate link - we may earn a commission at no extra cost to you
          </p>
        </div>
      )}
    </section>
  );
}

interface TourCardProps {
  tour: Tour;
}

function TourCard({ tour }: TourCardProps) {
  const location = locations.find((l) => l.id === tour.location);
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
          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3" />
              {location.label}, {location.country}
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
