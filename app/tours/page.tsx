import { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles, getArticleStats } from "@/lib/articles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, DollarSign } from "lucide-react";

export const metadata: Metadata = {
  title: "Ghost Tours & Haunted Experiences | Cursed Tours",
  description:
    "Discover paranormal tours, ghost walks, and haunted experiences worldwide. Browse our collection of spine-chilling adventures.",
  openGraph: {
    title: "Ghost Tours & Haunted Experiences",
    description:
      "Discover paranormal tours, ghost walks, and haunted experiences worldwide.",
    type: "website",
  },
};

// Revalidate every hour
export const revalidate = 3600;

interface ToursPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const perPage = 24;

  const [{ articles, total }, stats] = await Promise.all([
    getPublishedArticles({
      limit: perPage,
      offset: (currentPage - 1) * perPage,
    }),
    getArticleStats(),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Ghost Tours & Haunted Experiences
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mb-6">
            Explore {stats.published.toLocaleString()} paranormal tours, ghost walks, and
            spine-chilling adventures from around the world.
          </p>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>{stats.published.toLocaleString()} tours available</span>
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground">
            Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, total)} of {total.toLocaleString()} tours
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No tours found.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article) => (
              <TourCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {currentPage > 1 && (
              <Link
                href={currentPage === 2 ? "/tours" : `/tours?page=${currentPage - 1}`}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Previous
              </Link>
            )}
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Link
                    key={pageNum}
                    href={pageNum === 1 ? "/tours" : `/tours?page=${pageNum}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                      pageNum === currentPage
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-2">...</span>
                  <Link
                    href={`/tours?page=${totalPages}`}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    {totalPages}
                  </Link>
                </>
              )}
            </div>

            {currentPage < totalPages && (
              <Link
                href={`/tours?page=${currentPage + 1}`}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TourCardProps {
  article: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    featuredImageUrl: string | null;
    destination: string | null;
    price: string | null;
    currency: string | null;
    rating: string | null;
    reviewCount: number | null;
    durationMinutes: number | null;
  };
}

function TourCard({ article }: TourCardProps) {
  const formattedPrice = article.price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: article.currency || "USD",
      }).format(parseFloat(article.price))
    : null;

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <Link href={`/tour/${article.slug}`} className="group block">
      <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-xl border-border/50 hover:border-primary/30">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {article.featuredImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.featuredImageUrl}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <span className="text-4xl">👻</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {formattedPrice && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm font-bold border-0">
                From {formattedPrice}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {article.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {article.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {article.destination}
              </span>
            )}
            {article.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                {article.rating}
                {article.reviewCount && (
                  <span className="text-muted-foreground/70">
                    ({article.reviewCount.toLocaleString()})
                  </span>
                )}
              </span>
            )}
            {article.durationMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(article.durationMinutes)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
