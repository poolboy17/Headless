import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Terms of Service | Cursed Tours',
  description: 'Terms of Service for Cursed Tours - Rules and guidelines for using our website.',
};

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">Terms of Service</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: December 2025</p>

            <h2>Acceptance of Terms</h2>
            <p>By accessing and using Cursed Tours, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>

            <h2>Use of Content</h2>
            <p>All content on Cursed Tours, including text, images, and graphics, is owned by us or our content providers. You may:</p>
            <ul>
              <li>View and read our content for personal, non-commercial use</li>
              <li>Share links to our articles on social media</li>
              <li>Quote brief excerpts with proper attribution</li>
            </ul>
            <p>You may not:</p>
            <ul>
              <li>Reproduce, distribute, or republish our content without permission</li>
              <li>Use our content for commercial purposes</li>
              <li>Remove any copyright or proprietary notices</li>
            </ul>

            <h2>User Conduct</h2>
            <p>When using our website, you agree to:</p>
            <ul>
              <li>Provide accurate information when subscribing or contacting us</li>
              <li>Not engage in any activity that disrupts our services</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>

            <h2>Disclaimer</h2>
            <p>The content on Cursed Tours is provided for entertainment and informational purposes only. We make no warranties about the accuracy or completeness of the information provided. Ghost stories, paranormal accounts, and historical information are presented as reported and may not be verified.</p>

            <h2>Limitation of Liability</h2>
            <p>Cursed Tours shall not be liable for any damages arising from your use of our website or reliance on any information provided.</p>

            <h2>Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the new terms.</p>

            <h2>Contact</h2>
            <p>For questions about these Terms of Service, please visit our <Link href="/contact-us" className="text-primary hover:underline">Contact Page</Link>.</p>
          </div>
        </div>
      </div>
    </article>
  );
}
