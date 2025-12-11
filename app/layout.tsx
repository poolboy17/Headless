import type { Metadata, Viewport } from 'next';
import { Inter, Lora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackToTop } from '@/components/back-to-top';
import { getCategoriesForPage, getPostsForPage } from '@/lib/posts';
import { SiteSchema } from '@/components/Schema';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

const lora = Lora({ 
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
  fallback: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0a15' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://cursedtours.com'),
  title: {
    default: 'CURSED TOURS | Some Boundaries Aren\'t Meant to Be Crossed',
    template: '%s | CURSED TOURS',
  },
  description: 'Some boundaries aren\'t meant to be crossed. Explore haunted places, ghost hunting techniques, and paranormal investigations with Cursed Tours.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CURSED TOURS | Some Boundaries Aren\'t Meant to Be Crossed',
    description: 'Some boundaries aren\'t meant to be crossed. Explore haunted places, ghost hunting techniques, and paranormal investigations.',
    type: 'website',
    siteName: 'CURSED TOURS',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let categories: Awaited<ReturnType<typeof getCategoriesForPage>> = [];
  let postsData: { posts: Awaited<ReturnType<typeof getPostsForPage>>['posts'] } = { posts: [] };

  try {
    [categories, postsData] = await Promise.all([
      getCategoriesForPage(),
      getPostsForPage({ perPage: 4 }),
    ]);
  } catch {
    // Fallback if database is unavailable
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload optimized hero image for LCP */}
        <link 
          rel="preload" 
          as="image"
          type="image/webp"
          fetchPriority="high"
          imageSrcSet="/_next/image?url=%2Fassets%2Ffallbacks%2Fgothic_castle_midnight_storm.png&w=640&q=75 640w, /_next/image?url=%2Fassets%2Ffallbacks%2Fgothic_castle_midnight_storm.png&w=750&q=75 750w, /_next/image?url=%2Fassets%2Ffallbacks%2Fgothic_castle_midnight_storm.png&w=828&q=75 828w, /_next/image?url=%2Fassets%2Ffallbacks%2Fgothic_castle_midnight_storm.png&w=1080&q=75 1080w, /_next/image?url=%2Fassets%2Ffallbacks%2Fgothic_castle_midnight_storm.png&w=1200&q=75 1200w, /_next/image?url=%2Fassets%2Ffallbacks%2Fgothic_castle_midnight_storm.png&w=1920&q=75 1920w, /_next/image?url=%2Fassets%2Ffallbacks%2Fgothic_castle_midnight_storm.png&w=2048&q=75 2048w, /_next/image?url=%2Fassets%2Ffallbacks%2Fgothic_castle_midnight_storm.png&w=3840&q=75 3840w"
          imageSizes="100vw"
        />
        <link rel="dns-prefetch" href="https://wp.cursedtours.com" />
        <link rel="preconnect" href="https://wp.cursedtours.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <SiteSchema />
      </head>
      <body className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col bg-background">
            <Header categories={categories} />
            <main className="flex-1">
              {children}
            </main>
            <Footer categories={categories} recentPosts={postsData.posts} />
            <BackToTop />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
