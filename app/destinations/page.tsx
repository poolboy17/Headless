import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ChevronRight } from 'lucide-react';
import { destinations } from '@/lib/destinations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Haunted Destinations | Ghost Tours & Paranormal Experiences',
  description: 'Explore the world\'s most haunted destinations. From Dracula\'s Castle to the Salem Witch Trials, discover tours that bring dark history to life.',
  openGraph: {
    title: 'Haunted Destinations | Cursed Tours',
    description: 'Explore the world\'s most haunted destinations and book unforgettable paranormal experiences.',
    type: 'website',
  },
};

export default function DestinationsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-b from-gray-900 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-0">
            Explore the Unknown
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Haunted Destinations
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Step into history's darkest chapters. From ancient castles to cursed villages, 
            discover the stories that haunt these legendary locations.
          </p>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <Link
              key={destination.slug}
              href={`/destinations/${destination.slug}`}
              className="group block"
            >
              <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-2xl border-border/50 hover:border-primary/30">
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={destination.imageUrl}
                    alt={destination.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Badge className="mb-2 bg-primary/80 text-primary-foreground border-0 text-xs">
                      {destination.country}
                    </Badge>
                    <h2 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                      {destination.name}
                    </h2>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    {destination.city}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {destination.description}
                  </p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Explore Tours
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
