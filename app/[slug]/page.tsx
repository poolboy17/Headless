import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPage, getAllPageSlugs, stripHtml, WPPage } from '@/lib/wordpress';
import { sanitizeContent } from '@/lib/sanitize-content';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Reserved slugs that should not be handled by this route
const RESERVED_SLUGS = ['post', 'category', 'search', 'api'];

export async function generateStaticParams() {
  try {
    const slugs = await getAllPageSlugs();
    return slugs
      .filter(slug => !RESERVED_SLUGS.includes(slug))
      .map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getFeaturedImageFromPage(page: WPPage) {
  const media = page._embedded?.['wp:featuredmedia']?.[0];
  if (!media) return null;

  return {
    url: media.source_url,
    alt: media.alt_text || stripHtml(page.title.rendered),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (RESERVED_SLUGS.includes(slug)) {
    return { title: 'Not Found' };
  }

  const page = await getPage(slug);

  if (!page) {
    return { title: 'Page Not Found' };
  }

  const title = stripHtml(page.title.rendered);
  const description = stripHtml(page.excerpt?.rendered || '').slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
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

  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  const title = stripHtml(page.title.rendered);
  const featuredImage = getFeaturedImageFromPage(page);

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
            {title}
          </h1>
        </header>

        {featuredImage && (
          <div className="max-w-5xl mx-auto mb-12">
            <div className="aspect-[16/9] relative overflow-hidden rounded-3xl bg-muted">
              <Image
                src={featuredImage.url}
                alt={featuredImage.alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              />
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <div
            className="wp-content"
            dangerouslySetInnerHTML={{ __html: sanitizeContent(page.content.rendered) }}
          />
        </div>
      </div>
    </article>
  );
}
