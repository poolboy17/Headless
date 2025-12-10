import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getArticleBySlug, getArticleFaqs, getArticlesByDestination } from "@/lib/articles";
import { ContentSections } from "@/components/tour/ContentSections";
import { TourDetails } from "@/components/tour/TourDetails";
import type { ContentSection } from "@/types/tour-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: "Tour Not Found" };
  }

  return {
    title: article.title,
    description: article.metaDescription || article.excerpt || undefined,
    openGraph: {
      title: article.title,
      description: article.metaDescription || article.excerpt || undefined,
      images: article.featuredImageUrl ? [article.featuredImageUrl] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription || article.excerpt || undefined,
      images: article.featuredImageUrl ? [article.featuredImageUrl] : undefined,
    },
  };
}

export default async function TourArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Get FAQs and related articles
  const [faqs, relatedArticles] = await Promise.all([
    getArticleFaqs(article.id),
    article.destination
      ? getArticlesByDestination(article.destination, 4).then((articles) =>
          articles.filter((a) => a.id !== article.id).slice(0, 3)
        )
      : Promise.resolve([]),
  ]);

  // Format price
  const formattedPrice = article.price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: article.currency || "USD",
      }).format(parseFloat(article.price))
    : null;

  // Format duration
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${hours} hour${hours > 1 ? "s" : ""} ${mins} min`;
  };

  // Prepare schema JSON string
  const schemaJsonString = article.schemaJson
    ? JSON.stringify(article.schemaJson)
    : null;

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {schemaJsonString && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaJsonString }}
        />
      )}

      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 mb-6">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/tours" className="hover:text-primary">
              Ghost Tours
            </Link>
          </li>
          {article.destination && (
            <>
              <li>/</li>
              <li>
                <Link
                  href={`/tours/${article.destination.toLowerCase().replace(/\s+/g, "-")}`}
                  className="hover:text-primary"
                >
                  {article.destination}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-gray-700 truncate max-w-[200px]">{article.title}</li>
        </ol>
      </nav>

      {/* Featured Image */}
      {article.featuredImageUrl && (
        <div className="relative w-full h-[400px] mb-8 rounded-xl overflow-hidden">
          <Image
            src={article.featuredImageUrl}
            alt={article.featuredImageAlt || article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Title and Meta */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {article.destination && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {article.destination}
            </span>
          )}
          {article.rating && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {article.rating}/5
              {article.reviewCount && (
                <span className="text-gray-400">({article.reviewCount} reviews)</span>
              )}
            </span>
          )}
          {formattedPrice && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              From {formattedPrice}
            </span>
          )}
          {article.durationMinutes && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDuration(article.durationMinutes)}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      {article.contentSections ? (
        <ContentSections sections={article.contentSections as ContentSection[]} />
      ) : (
        <div
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}

      {/* Tour Details */}
      <TourDetails
        inclusions={article.inclusions}
        exclusions={article.exclusions}
        meetingPoint={article.meetingPoint}
        accessibility={article.accessibility}
        duration={formatDuration(article.durationMinutes)}
      />

      {/* CTA Button (if booking URL exists) */}
      {article.bookingUrl && (
        <div className="my-12 text-center">
          <a
            href={article.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-red-600 hover:bg-red-700 text-white text-xl font-semibold px-8 py-4 rounded-lg shadow-lg transition-colors"
          >
            Book This Haunted Tour Now
          </a>
        </div>
      )}

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="my-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group bg-gray-50 rounded-lg p-4 cursor-pointer"
              >
                <summary className="font-semibold text-gray-900 list-none flex justify-between items-center">
                  {faq.question}
                  <svg
                    className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <p className="mt-4 text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related Tours */}
      {relatedArticles.length > 0 && (
        <section className="my-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            More Ghost Tours in {article.destination}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/tour/${related.slug}`}
                className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {related.featuredImageUrl && (
                  <div className="relative h-40">
                    <Image
                      src={related.featuredImageUrl}
                      alt={related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary">
                    {related.title}
                  </h3>
                  {related.rating && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                      <svg
                        className="w-4 h-4 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {related.rating}/5
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
