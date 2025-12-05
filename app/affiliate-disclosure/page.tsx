import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | Cursed Tours',
  description: 'Affiliate Disclosure for Cursed Tours - Our relationship with affiliate partners.',
};

export default function AffiliateDisclosurePage() {
  return (
    <article className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </Link>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">Affiliate Disclosure</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: December 2025</p>

            <h2>Our Commitment to Transparency</h2>
            <p>At Cursed Tours, we believe in being transparent with our readers about how we earn revenue to support our content creation.</p>

            <h2>Affiliate Relationships</h2>
            <p>Some of the links on Cursed Tours are affiliate links. This means that if you click on a link and make a purchase, we may receive a small commission at no additional cost to you.</p>

            <h2>What This Means for You</h2>
            <ul>
              <li>You will never pay more for a product or service by using our affiliate links</li>
              <li>Our affiliate relationships do not influence our editorial content</li>
              <li>We only recommend products and services we believe will benefit our readers</li>
              <li>All opinions expressed are our own</li>
            </ul>

            <h2>Types of Affiliate Programs</h2>
            <p>We may participate in affiliate programs including but not limited to:</p>
            <ul>
              <li>Amazon Associates Program</li>
              <li>Travel and tour booking platforms</li>
              <li>Book retailers</li>
              <li>Paranormal investigation equipment suppliers</li>
            </ul>

            <h2>Editorial Integrity</h2>
            <p>Our editorial content is created independently of our affiliate partnerships. We are committed to providing honest, accurate, and helpful information to our readers, regardless of affiliate relationships.</p>

            <h2>FTC Compliance</h2>
            <p>This disclosure is provided in accordance with the Federal Trade Commission&apos;s guidelines on endorsements and testimonials.</p>

            <h2>Questions?</h2>
            <p>If you have any questions about our affiliate relationships, please visit our <Link href="/contact-us" className="text-primary hover:underline">Contact Page</Link>.</p>
          </div>
        </div>
      </div>
    </article>
  );
}
