'use client';

import Link from 'next/link';
import { SiX, SiFacebook, SiInstagram, SiYoutube } from 'react-icons/si';
import { NewsletterSignup } from '@/components/newsletter-signup';
import type { WPPost, WPCategory } from '@/lib/wordpress';
import { stripHtml } from '@/lib/wordpress';

interface FooterProps {
  categories: WPCategory[];
  recentPosts?: WPPost[];
}

export function Footer({ categories, recentPosts }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-900/10 dark:border-transparent bg-white dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2">
            <div>
              <h3 className="text-sm font-semibold leading-6">About</h3>
              <ul className="mt-6 space-y-4">
                <li>
                  <Link href="/" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/contact-us" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold leading-6">Categories</h3>
              <ul className="mt-6 space-y-4">
                {categories.slice(0, 5).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/category/${category.slug}`}
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`footer-category-${category.slug}`}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold leading-6">Recent</h3>
              <ul className="mt-6 space-y-4">
                {recentPosts?.slice(0, 4).map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/post/${post.slug}`}
                      className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors line-clamp-1"
                      data-testid={`footer-post-${post.id}`}
                    >
                      {stripHtml(post.title.rendered)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold leading-6">Legal</h3>
              <ul className="mt-6 space-y-4">
                <li>
                  <Link href="/privacy-policy" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/affiliate-disclosure" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Affiliate Disclosure
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 xl:mt-0">
            <NewsletterSignup />
          </div>
        </div>

        <div className="mt-16 border-t border-gray-900/10 dark:border-neutral-700 pt-8 sm:mt-20 md:flex md:items-center md:justify-between lg:mt-24">
          <div className="flex flex-wrap gap-x-6 gap-y-3 md:order-2">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="social-twitter">
              <SiX className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="social-facebook">
              <SiFacebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="social-instagram">
              <SiInstagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="social-youtube">
              <SiYoutube className="h-5 w-5" />
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-sm font-semibold text-foreground tracking-tight">CURSED TOURS</p>
            <p className="text-xs text-muted-foreground mt-0.5">&copy; {currentYear} All rights reserved. Some boundaries aren&apos;t meant to be crossed.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
