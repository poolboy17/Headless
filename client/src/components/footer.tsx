import { Link } from "wouter";
import { Mail } from "lucide-react";
import { SiTwitter, SiFacebook, SiInstagram, SiYoutube } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WPCategory, EnrichedPost } from "@shared/schema";

interface FooterProps {
  categories: WPCategory[];
  recentPosts?: EnrichedPost[];
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export function Footer({ categories, recentPosts }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-900/10 dark:border-transparent bg-white dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Menu Columns */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2">
            {/* About */}
            <div>
              <h3 className="text-sm font-semibold leading-6">
                About
              </h3>
              <ul className="mt-6 space-y-4">
                <li>
                  <Link href="/" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold leading-6">
                Categories
              </h3>
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

            {/* Recent Posts */}
            <div>
              <h3 className="text-sm font-semibold leading-6">
                Recent
              </h3>
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

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold leading-6">
                Legal
              </h3>
              <ul className="mt-6 space-y-4">
                <li>
                  <Link href="/privacy" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-10 xl:mt-0">
            <h3 className="text-sm font-semibold leading-6">
              Subscribe to our newsletter
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The latest paranormal news, articles, and investigations, sent to your inbox weekly.
            </p>
            <form className="mt-6 flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border-0"
                data-testid="input-newsletter-email"
              />
              <Button type="submit" className="rounded-full px-4" data-testid="button-newsletter-subscribe">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 border-t border-gray-900/10 dark:border-neutral-700 pt-8 sm:mt-20 md:flex md:items-center md:justify-between lg:mt-24">
          {/* Social Links */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 md:order-2">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="social-twitter"
            >
              <SiTwitter className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="social-facebook"
            >
              <SiFacebook className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="social-instagram"
            >
              <SiInstagram className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="social-youtube"
            >
              <SiYoutube className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-8 text-sm leading-5 text-muted-foreground md:order-1 md:mt-0">
            &copy; {currentYear} Cursed Tours. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
