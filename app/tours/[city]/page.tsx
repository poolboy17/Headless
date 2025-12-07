import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Star, Users, ExternalLink, ChevronLeft } from 'lucide-react';
import { cities, getCityById, getToursByCity, getAllCityIds, getAffiliateUrl, getCityViatorUrl, tourTypes, type Tour } from '@/lib/tours';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/pagination';
import { CityIcon } from '@/components/city-icon';
import { ViatorProductsIsland } from '@/components/viator-products-island';

export const dynamic = 'force-static';
export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllCityIds().map((city) => ({ city }));
}

interface CityPageProps {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city: cityId } = await params;
  const city = getCityById(cityId);
  
  if (!city) {
    return { title: 'City Not Found' };
  }

  return {
    title: `Ghost Tours in ${city.label} | Haunted Tours & Paranormal Experiences`,
    description: city.description,
    openGraph: {
      title: `Ghost Tours in ${city.label}`,
      description: city.description,
      images: [city.imageUrl],
    },
  };
}

export default async function CityToursPage({ params, searchParams }: CityPageProps) {
  const { city: cityId } = await params;
  const { page } = await searchParams;
  const requestedPage = Math.max(1, parseInt(page || '1', 10));
  const toursPerPage = 6;

  const city = getCityById(cityId);

  if (!city) {
    notFound();
  }

  // Static tours data (always available, no external API calls)
  const staticData = getToursByCity(cityId, requestedPage, toursPerPage);
  const { tours: staticTours, totalTours, totalPages, currentPage } = staticData;
  
  // Redirect if page is out of bounds
  if (totalTours > 0 && requestedPage > totalPages) {
    redirect(totalPages === 1 ? `/tours/${cityId}` : `/tours/${cityId}?page=${totalPages}`);
  }

  const viatorCityUrl = getCityViatorUrl(city);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
        <Image
          src={city.imageUrl}
          alt={`Ghost tours in ${city.label}`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
          <div className="container mx-auto">
            <Link 
              href="/#tours" 
              className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 transition-colors"
              data-testid="link-back-to-tours"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to all cities
            </Link>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-white/80">{city.country}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Ghost Tours in {city.label}
            </h1>
            <p className="text-white/90 max-w-2xl text-lg">
              {city.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="container mx-auto px-4 py-12">
        {/* Live Products Island - fetches data client-side */}
        <ViatorProductsIsland citySlug={cityId} viatorCityUrl={viatorCityUrl} />

        {/* Static Tours Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold mb-1">Featured Tours</h2>
              <p className="text-muted-foreground text-sm">
                {currentPage > 1 ? `Page ${currentPage} of ${totalPages} - ` : ''}{totalTours} curated {totalTours === 1 ? 'tour' : 'tours'}
              </p>
            </div>
            <a
              href={viatorCityUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
            >
              <Button variant="outline" className="gap-2" data-testid="button-view-all-viator">
                View all on Viator
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {staticTours.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No curated tours for this city yet.</p>
              <a
                href={viatorCityUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                <Button className="gap-2" data-testid="button-browse-viator-empty">
                  Browse tours on Viator
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {staticTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}

          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            basePath={`/tours/${cityId}`} 
          />
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center p-8 bg-muted/30 rounded-xl border border-border/50">
          <h3 className="text-xl font-bold mb-2">Looking for more options?</h3>
          <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
            Explore hundreds of ghost tours, paranormal experiences, and haunted adventures in {city.label} on Viator.
          </p>
          <a
            href={viatorCityUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            <Button size="lg" className="gap-2" data-testid="button-explore-viator">
              Explore on Viator
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-3">
            Affiliate link - we may earn a commission at no extra cost to you
          </p>
        </div>

        {/* Other Cities */}
        <div className="mt-16">
          <h3 className="text-xl font-bold mb-6">Explore Other Cities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {cities.filter(c => c.id !== cityId).slice(0, 6).map((otherCity) => (
              <Link
                key={otherCity.id}
                href={`/tours/${otherCity.id}`}
                className="group flex flex-col items-center p-4 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-muted/50 transition-all"
                data-testid={`link-city-${otherCity.id}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden mb-2 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                  <CityIcon
                    cityId={otherCity.id}
                    alt={`${otherCity.label} ghost tours`}
                    size={48}
                    className="w-full h-full"
                  />
                </div>
                <span className="font-medium text-sm text-center">{otherCity.label}</span>
                <span className="text-xs text-muted-foreground">{otherCity.country}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TourCardProps {
  tour: Tour;
}

function TourCard({ tour }: TourCardProps) {
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
              <Badge className="bg-primary/90 text-primary-foreground border-0 text-[10px] uppercase tracking-wider">
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
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {tour.groupSize}
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
