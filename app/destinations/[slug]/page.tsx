import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Calendar, Lightbulb, ChevronLeft, ExternalLink, Star } from 'lucide-react';
import { 
  destinations, 
  getDestinationBySlug, 
  getAllDestinationSlugs, 
  getDestinationViatorUrl,
  type Destination 
} from '@/lib/destinations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DestinationToursIsland } from '@/components/destination-tours-island';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDestinationSlugs().map((slug) => ({ slug }));
}

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const destination = getDestinationBySlug(slug);
  
  if (!destination) {
    return { title: 'Destination Not Found' };
  }

  return {
    title: `${destination.name} Ghost Tours | Haunted ${destination.city}`,
    description: destination.description,
    openGraph: {
      title: `${destination.name} - ${destination.tagline}`,
      description: destination.description,
      images: [destination.imageUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${destination.name} Ghost Tours`,
      description: destination.description,
    },
  };
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const destination = getDestinationBySlug(slug);

  if (!destination) {
    notFound();
  }

  const viatorUrl = getDestinationViatorUrl(destination);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <Image
          src={destination.imageUrl}
          alt={destination.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
          <div className="container mx-auto">
            <Link 
              href="/#tours" 
              className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to destinations
            </Link>
            <Badge className="mb-3 bg-primary/80 text-primary-foreground border-0">
              {destination.country}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3">
              {destination.name}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-2 italic">
              {destination.tagline}
            </p>
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="w-4 h-4" />
              <span>{destination.city}, {destination.country}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Description */}
        <div className="max-w-3xl mb-12">
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            {destination.description}
          </p>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {destination.longDescription.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Tours Section */}
        <DestinationToursIsland 
          destination={destination} 
          viatorUrl={viatorUrl} 
        />

        {/* Highlights */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            Highlights
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {destination.highlights.map((highlight, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">{i + 1}</span>
                  </div>
                  <p className="text-sm">{highlight}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Best Time & Tips */}
        <div className="grid gap-8 md:grid-cols-2 mt-16">
          {/* Best Time to Visit */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Best Time to Visit
            </h2>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <p className="text-muted-foreground">{destination.bestTimeToVisit}</p>
              </CardContent>
            </Card>
          </section>

          {/* Tips */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Tips for Visitors
            </h2>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <ul className="space-y-2">
                  {destination.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center p-8 bg-muted/30 rounded-xl border border-border/50">
          <h3 className="text-xl font-bold mb-2">Ready to Explore {destination.name}?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Book your haunted adventure today and experience the dark history firsthand.
          </p>
          <a
            href={viatorUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            <Button size="lg" className="gap-2">
              Find Tours on Viator
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-3">
            Affiliate link - we may earn a commission at no extra cost to you
          </p>
        </div>

        {/* Other Destinations */}
        <section className="mt-16">
          <h3 className="text-xl font-bold mb-6">Explore Other Haunted Destinations</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.filter(d => d.slug !== slug).map((other) => (
              <Link
                key={other.slug}
                href={`/destinations/${other.slug}`}
                className="group"
              >
                <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
                  <div className="relative h-40">
                    <Image
                      src={other.imageUrl}
                      alt={other.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="font-bold text-white">{other.name}</h4>
                      <p className="text-xs text-white/80">{other.city}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
