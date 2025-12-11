import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { sanitizeContent } from '@/lib/sanitize-content';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Reserved slugs that should not be handled by this route
const RESERVED_SLUGS = [
  'post',
  'category',
  'search',
  'api',
  'about-us',
  'contact-us',
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
  'affiliate-disclosure',
  'blog',
  'guides',
  'movies',
];

// Static pages content (hardcoded since we don't have a pages table)
// These are fallbacks - actual pages should be in their own route folders
const STATIC_PAGES: Record<string, { title: string; content: string; excerpt?: string }> = {
  // Add any additional static pages here if needed
};

export async function generateStaticParams() {
  // Return static page slugs that aren't reserved
  return Object.keys(STATIC_PAGES)
    .filter(slug => !RESERVED_SLUGS.includes(slug))
    .map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (RESERVED_SLUGS.includes(slug)) {
    return { title: 'Not Found' };
  }

  const page = STATIC_PAGES[slug];
  if (!page) {
    return { title: 'Page Not Found' };
  }

  return {
    title: page.title,
    description: page.excerpt || page.content.slice(0, 160),
    openGraph: {
      title: page.title,
      description: page.excerpt || page.content.slice(0, 160),
      type: 'website',
    },
  };
}

export default async function PageRoute({ params }: PageProps) {
  const { slug } = await params;

  // Don't handle reserved slugs
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  const page = STATIC_PAGES[slug];
  if (!page) {
    notFound();
  }

  return (
    <article className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </Link>

        <header className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {page.title}
          </h1>
        </header>

        <div className="max-w-3xl mx-auto">
          <div
            className="wp-content"
            dangerouslySetInnerHTML={{ __html: sanitizeContent(page.content) }}
          />
        </div>
      </div>
    </article>
  );
}
