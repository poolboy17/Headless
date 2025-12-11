import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Ghost, Flashlight, FileText, Shield, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { searchPostsForPage } from '@/lib/posts';
import { stripHtml } from '@/lib/wordpress';
import { PostCard } from '@/components/post-card';
import { SITE_URL, SITE_NAME } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: `Complete Guide to Paranormal Investigation | ${SITE_NAME}`,
  description: 'Master paranormal investigation with our comprehensive guide. Learn ghost hunting techniques, equipment essentials, safety protocols, and evidence documentation from experienced investigators.',
  keywords: ['paranormal investigation', 'ghost hunting', 'EVP recording', 'EMF detection', 'spirit communication', 'haunted locations'],
  alternates: {
    canonical: `${SITE_URL}/guides/paranormal-investigation`,
  },
  openGraph: {
    title: 'Complete Guide to Paranormal Investigation',
    description: 'Everything you need to know about investigating the paranormal - from beginner basics to advanced techniques.',
    type: 'article',
    url: `${SITE_URL}/guides/paranormal-investigation`,
  },
};

// Hub page sections with their search queries
const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Essential knowledge for beginning your paranormal investigation journey',
    icon: Ghost,
    searchQuery: 'ghost hunting beginner guide',
  },
  {
    id: 'equipment',
    title: 'Investigation Equipment',
    description: 'Tools and technology for detecting and documenting paranormal activity',
    icon: Radio,
    searchQuery: 'EMF EVP equipment ghost hunting',
  },
  {
    id: 'techniques',
    title: 'Investigation Techniques',
    description: 'Proven methods for communicating with spirits and capturing evidence',
    icon: Flashlight,
    searchQuery: 'paranormal investigation technique method',
  },
  {
    id: 'safety',
    title: 'Safety & Preparation',
    description: 'Stay safe during investigations with proper preparation and protocols',
    icon: Shield,
    searchQuery: 'safety tips paranormal urban exploration',
  },
  {
    id: 'documentation',
    title: 'Evidence & Documentation',
    description: 'How to properly document and analyze paranormal evidence',
    icon: FileText,
    searchQuery: 'EVP evidence paranormal documentation',
  },
];

export default async function ParanormalInvestigationGuidePage() {
  // Fetch posts for each section using search
  const sectionData = await Promise.all(
    SECTIONS.map(async (section) => {
      const { posts } = await searchPostsForPage({ query: section.searchQuery, perPage: 6 });
      return { ...section, posts };
    })
  );

  // Also get general paranormal posts for the main listing
  const { posts: allPosts, totalPosts } = await searchPostsForPage({ 
    query: 'paranormal ghost investigation',
    perPage: 12 
  });

  return (
    <article className="min-h-screen">
      {/* Schema.org Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Guide',
            name: 'Complete Guide to Paranormal Investigation',
            description: 'Comprehensive guide covering all aspects of paranormal investigation including equipment, techniques, safety, and evidence documentation.',
            url: `${SITE_URL}/guides/paranormal-investigation`,
            author: { '@type': 'Organization', name: SITE_NAME },
            publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
          }),
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </Link>

        {/* Hero Section */}
        <header className="max-w-4xl mx-auto mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Ghost className="h-4 w-4" />
            Comprehensive Guide
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Complete Guide to Paranormal Investigation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about investigating the supernatural—from choosing 
            the right equipment to documenting evidence and staying safe during explorations.
          </p>
        </header>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert mb-16">
          <p>
            Paranormal investigation combines scientific methodology with an open mind toward 
            the unexplained. Whether you&apos;re drawn to <Link href="/category/abandoned-asylums-hospitals">abandoned asylums</Link>, 
            historic battlefields, or reportedly haunted hotels, understanding proper investigation 
            techniques is essential for meaningful experiences.
          </p>
          <p>
            This guide compiles our most valuable resources across five key areas: getting started, 
            equipment selection, investigation techniques, safety protocols, and evidence documentation.
          </p>
        </div>

        {/* Quick Navigation */}
        <nav className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Jump to Section</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <a key={section.id} href={`#${section.id}`} className="flex flex-col items-center p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-center">
                  <Icon className="h-8 w-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">{section.title}</span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Content Sections */}
        {sectionData.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} id={section.id} className="mb-16 scroll-mt-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                  <h2 className="text-3xl font-bold">{section.title}</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl">{section.description}</p>
                {section.posts.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {section.posts.map((post) => (<PostCard key={post.id} post={post} />))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">More articles coming soon...</p>
                )}
              </div>
            </section>
          );
        })}

        {/* All Related Posts */}
        <section className="mb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">More Paranormal Investigation Articles</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Explore our complete collection of {totalPosts}+ paranormal investigation resources.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {allPosts.map((post) => (<PostCard key={post.id} post={post} />))}
            </div>
            <div className="text-center">
              <Link href="/category/ghost-hunting-techniques-tools">
                <Button size="lg">View All Investigation Articles</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Guides CTA */}
        <section className="max-w-4xl mx-auto bg-muted/50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Explore More Guides</h2>
          <p className="text-muted-foreground mb-6">Dive deeper into specific topics with our specialized guides.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/guides/abandoned-asylums"><Button variant="outline">Abandoned Asylums Guide</Button></Link>
            <Link href="/guides/ghost-hunting-equipment"><Button variant="outline">Equipment Guide</Button></Link>
            <Link href="/guides/urban-exploration-safety"><Button variant="outline">Safety Guide</Button></Link>
          </div>
        </section>
      </div>
    </article>
  );
}
