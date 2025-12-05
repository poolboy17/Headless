import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Ghost, Building2, Radio, Shield, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Paranormal Exploration Guides | Cursed Tours',
  description: 'Comprehensive guides for paranormal investigation, urban exploration, and ghost hunting. Expert resources for exploring haunted locations safely.',
  keywords: ['paranormal guides', 'ghost hunting guide', 'urban exploration', 'abandoned places'],
};

const GUIDES = [
  {
    slug: 'paranormal-investigation',
    title: 'Complete Guide to Paranormal Investigation',
    description: 'Master ghost hunting techniques, evidence documentation, and spirit communication methods.',
    icon: Ghost,
    color: 'from-purple-500/20 to-purple-500/5',
  },
  {
    slug: 'abandoned-asylums',
    title: 'Abandoned Asylums & Hospitals',
    description: 'Explore the haunting world of forgotten mental institutions with expert guidance.',
    icon: Building2,
    color: 'from-blue-500/20 to-blue-500/5',
  },
  {
    slug: 'ghost-hunting-equipment',
    title: 'Ghost Hunting Equipment Guide',
    description: 'Essential tools for detecting and documenting paranormal activity.',
    icon: Radio,
    color: 'from-green-500/20 to-green-500/5',
  },
  {
    slug: 'urban-exploration-safety',
    title: 'Urban Exploration Safety',
    description: 'Stay safe while exploring abandoned locations with these critical protocols.',
    icon: Shield,
    color: 'from-red-500/20 to-red-500/5',
  },
];

export default function GuidesIndexPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </Link>

        {/* Hero */}
        <header className="max-w-4xl mx-auto mb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            Resource Hub
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Exploration Guides
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive guides crafted by experienced paranormal investigators 
            and urban explorers. Everything you need to explore the unknown safely and effectively.
          </p>
        </header>

        {/* Guide Cards */}
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2">
          {GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link 
                key={guide.slug} 
                href={`/guides/${guide.slug}`}
                className="group block"
              >
                <div className={`bg-gradient-to-br ${guide.color} rounded-xl p-8 h-full border border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-lg`}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-background/80 rounded-lg group-hover:bg-primary/10 transition-colors">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {guide.title}
                      </h2>
                      <p className="text-muted-foreground">
                        {guide.description}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary">
                        Read Guide
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <section className="max-w-4xl mx-auto mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-muted-foreground mb-6">
            Browse our complete collection of paranormal and exploration content.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/category/abandoned-asylums-hospitals">
              <Button size="lg">Browse All Articles</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">Return Home</Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
