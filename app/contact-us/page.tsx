import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Contact Us | Cursed Tours',
  description: 'Get in touch with Cursed Tours - We would love to hear from you.',
};

export default function ContactUsPage() {
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">Contact Us</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">
              Have a ghost story to share? Found an error in one of our articles? Want to collaborate? We&apos;d love to hear from you.
            </p>

            <div className="not-prose grid gap-6 md:grid-cols-2 mb-12">
              <div className="p-6 rounded-2xl bg-muted/50 border">
                <Mail className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Email Us</h3>
                <p className="text-muted-foreground text-sm mb-3">For general inquiries and story submissions</p>
                <a href="mailto:hello@cursedtours.com" className="text-primary hover:underline">
                  hello@cursedtours.com
                </a>
              </div>

              <div className="p-6 rounded-2xl bg-muted/50 border">
                <MapPin className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Location</h3>
                <p className="text-muted-foreground text-sm mb-3">We cover haunted locations worldwide</p>
                <span className="text-foreground">Remote Team, Global Coverage</span>
              </div>
            </div>

            <h2>Get In Touch</h2>
            <p>We welcome messages about:</p>
            <ul>
              <li><strong>Story Submissions</strong> - Share your paranormal experiences or haunted location discoveries</li>
              <li><strong>Corrections</strong> - Help us maintain accuracy in our historical and factual content</li>
              <li><strong>Partnerships</strong> - Interested in collaborating with Cursed Tours?</li>
              <li><strong>Press Inquiries</strong> - Media requests and interview opportunities</li>
              <li><strong>General Questions</strong> - Anything else on your mind</li>
            </ul>

            <h2>Response Time</h2>
            <p>We aim to respond to all inquiries within 48-72 hours. Due to the volume of messages we receive, we may not be able to respond to every ghost story submission, but we read and appreciate each one.</p>

            <h2>Follow Us</h2>
            <p>Stay connected with Cursed Tours on social media for the latest updates, behind-the-scenes content, and community discussions.</p>
          </div>
        </div>
      </div>
    </article>
  );
}
