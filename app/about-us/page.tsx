import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Cursed Tours - your guide to paranormal experiences and ghostly adventures around the world.',
};

export default function AboutUsPage() {
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
            About Cursed Tours
          </h1>
        </header>

        <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
          <p>
            Welcome to <strong>Cursed Tours</strong>, your premier destination for exploring the mysterious
            and supernatural side of travel. We curate the most thrilling paranormal experiences,
            haunted locations, and ghostly adventures from around the world.
          </p>

          <h2>Our Mission</h2>
          <p>
            We believe that every destination has stories waiting to be discovered—tales of history,
            mystery, and the unexplained. Our mission is to connect curious travelers with authentic
            paranormal experiences while respecting the history and heritage of each location.
          </p>

          <h2>What We Offer</h2>
          <ul>
            <li>Curated guides to haunted destinations worldwide</li>
            <li>In-depth articles on paranormal investigation techniques</li>
            <li>Reviews and recommendations for ghost tours and experiences</li>
            <li>Historical insights into famous hauntings</li>
          </ul>

          <h2>Join the Journey</h2>
          <p>
            Whether you&apos;re a seasoned ghost hunter or simply curious about the supernatural,
            Cursed Tours invites you to explore the unknown. Subscribe to our newsletter for the
            latest updates on haunted destinations and paranormal discoveries.
          </p>

          <p>
            Have questions or want to share your own paranormal experience?
            <Link href="/contact-us" className="text-primary hover:underline"> Contact us</Link>.
          </p>
        </div>
      </div>
    </article>
  );
}
