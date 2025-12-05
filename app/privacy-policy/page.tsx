import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Privacy Policy | Cursed Tours',
  description: 'Privacy Policy for Cursed Tours - How we collect, use, and protect your information.',
};

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">Privacy Policy</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: December 2025</p>

            <h2>Information We Collect</h2>
            <p>When you visit Cursed Tours, we may collect certain information automatically, including:</p>
            <ul>
              <li>Your IP address and browser type</li>
              <li>Pages you visit and time spent on our site</li>
              <li>Referring website addresses</li>
              <li>Information you provide when subscribing to our newsletter</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve our content and services</li>
              <li>Send newsletters and updates (with your consent)</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Respond to your inquiries</li>
            </ul>

            <h2>Cookies</h2>
            <p>We use cookies to enhance your browsing experience. These small text files are stored on your device and help us:</p>
            <ul>
              <li>Remember your preferences</li>
              <li>Understand how you use our site</li>
              <li>Improve our content based on your interests</li>
            </ul>

            <h2>Third-Party Services</h2>
            <p>We may use third-party services such as Google Analytics to help us understand how visitors use our site. These services may collect information about your visits.</p>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
            </ul>

            <h2>Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us through our <Link href="/contact-us" className="text-primary hover:underline">Contact Page</Link>.</p>
          </div>
        </div>
      </div>
    </article>
  );
}
