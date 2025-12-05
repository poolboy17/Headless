import type { Metadata, Viewport } from 'next';
import { Inter, Lora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BackToTop } from '@/components/back-to-top';
import { getCategories, getPosts } from '@/lib/wordpress';
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
  title: {
    default: 'CURSED TOURS | Some Boundaries Aren\'t Meant to Be Crossed',
    template: '%s | CURSED TOURS',
  },
  description: 'Some boundaries aren\'t meant to be crossed. Explore haunted places, ghost hunting techniques, and paranormal investigations with Cursed Tours.',
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
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let postsData: Awaited<ReturnType<typeof getPosts>> = { posts: [], totalPosts: 0, totalPages: 0 };

  try {
    [categories, postsData] = await Promise.all([
      getCategories(),
      getPosts({ perPage: 4 }),
    ]);
  } catch {
    // Fallback if WordPress API is unavailable
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://wp.cursedtours.com" />
        <link rel="preconnect" href="https://wp.cursedtours.com" crossOrigin="anonymous" />
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
