import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Cookie Policy | Cursed Tours',
  description: 'Cookie Policy for Cursed Tours - How we use cookies and similar technologies.',
};

export default function CookiePolicyPage() {
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
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">Cookie Policy</h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">Last updated: December 2025</p>

            <h2>What Are Cookies?</h2>
            <p>Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience.</p>

            <h2>How We Use Cookies</h2>
            <p>Cursed Tours uses cookies for the following purposes:</p>

            <h3>Essential Cookies</h3>
            <p>These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.</p>

            <h3>Analytics Cookies</h3>
            <p>We use analytics cookies to understand how visitors interact with our website. This helps us improve our content and user experience. These cookies collect information anonymously.</p>

            <h3>Preference Cookies</h3>
            <p>These cookies remember your preferences, such as your preferred theme (light or dark mode), to provide a more personalized experience.</p>

            <h2>Third-Party Cookies</h2>
            <p>Some cookies on our site are set by third-party services, including:</p>
            <ul>
              <li><strong>Google Analytics</strong> - For understanding site traffic and usage</li>
              <li><strong>Cloudflare</strong> - For security and performance optimization</li>
            </ul>

            <h2>Managing Cookies</h2>
            <p>You can control and manage cookies in several ways:</p>
            <ul>
              <li><strong>Browser Settings</strong> - Most browsers allow you to refuse or delete cookies through their settings</li>
              <li><strong>Opt-Out Links</strong> - Many third-party services provide opt-out mechanisms</li>
            </ul>
            <p>Please note that disabling cookies may affect the functionality of our website.</p>

            <h2>Updates to This Policy</h2>
            <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>

            <h2>Contact Us</h2>
            <p>If you have questions about our use of cookies, please visit our <Link href="/contact-us" className="text-primary hover:underline">Contact Page</Link>.</p>
          </div>
        </div>
      </div>
    </article>
  );
}
