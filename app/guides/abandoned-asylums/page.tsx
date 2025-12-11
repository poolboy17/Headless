import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Building2, AlertTriangle, Camera, History, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPosts } from '@/lib/wordpress';
import { PostCard } from '@/components/post-card';
import { SITE_URL, SITE_NAME } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: `Abandoned Asylums & Hospitals: Complete Exploration Guide | ${SITE_NAME}`,
  description: 'Discover the haunting world of abandoned mental institutions and hospitals. Expert guides on urban exploration, safety tips, historical context, and paranormal investigation techniques.',
  keywords: ['abandoned asylum', 'abandoned hospital', 'urban exploration', 'mental institution', 'haunted hospital', 'urbex'],
  alternates: {
    canonical: `${SITE_URL}/guides/abandoned-asylums`,
  },
  openGraph: {
    title: 'Abandoned Asylums & Hospitals: Complete Exploration Guide',
    description: 'Expert guides for exploring abandoned mental institutions safely and respectfully.',
    type: 'article',
    url: `${SITE_URL}/guides/abandoned-asylums`,
  },
};

const CONTENT_SECTIONS = [
  {
    id: 'exploration-guides',
    title: 'Exploration Guides',
    description: 'Step-by-step guides for exploring abandoned medical facilities',
    icon: MapPin,
    category: 'abandoned-asylums-hospitals',
  },
  {
    id: 'safety',
    title: 'Safety & Legal',
    description: 'Essential safety protocols and legal considerations',
    icon: AlertTriangle,
    tag: 'safety-tips',
  },
  {
    id: 'history',
    title: 'Historical Context',
    description: 'Understanding the dark history of mental institutions',
    icon: History,
    tag: 'ghost-stories',
  },
  {
    id: 'documentation',
    title: 'Photography & Documentation',
    description: 'Capture the haunting beauty while preserving history',
    icon: Camera,
    tag: 'urban-exploration',
  },
];

export default async function AbandonedAsylumsGuidePage() {
  // Fetch main category posts
  const { posts: categoryPosts, totalPosts } = await getPosts({ 
    category: 'abandoned-asylums-hospitals', 
    perPage: 18 
  });

  // Fetch posts for each content section
  const sectionData = await Promise.all(
    CONTENT_SECTIONS.map(async (section) => {
      if (section.category) {
        const { posts } = await getPosts({ category: section.category, perPage: 6 });
        return { ...section, posts };
      }
      const { posts } = await getPosts({ tag: section.tag, perPage: 6 });
      return { ...section, posts };
    })
  );

  return (
    <article className="min-h-screen">
      {/* Schema.org Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Guide',
            name: 'Abandoned Asylums & Hospitals: Complete Exploration Guide',
            description: 'Comprehensive guide to exploring abandoned mental institutions and hospitals safely.',
            url: `${SITE_URL}/guides/abandoned-asylums`,
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
            <Building2 className="h-4 w-4" />
            Exploration Guide
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Abandoned Asylums & Hospitals
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Step into the haunting corridors of forgotten mental institutions. 
            Our comprehensive guides cover everything from safety protocols to 
            paranormal investigation techniques.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            {totalPosts}+ articles covering abandoned medical facilities
          </p>
        </header>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert mb-16">
          <p>
            Abandoned asylums and hospitals stand as haunting monuments to medical history. 
            These institutions once housed thousands of patients, and many believe their 
            spirits still linger within the crumbling walls. For urban explorers and 
            <Link href="/guides/paranormal-investigation"> paranormal investigators</Link>, 
            these locations offer unparalleled opportunities for discovery.
          </p>
          <p>
            However, exploring these sites requires careful preparation. Structural hazards, 
            environmental dangers like asbestos, and legal considerations must all be addressed 
            before any investigation. Our guides provide the knowledge you need to explore 
            these fascinating locations safely and respectfully.
          </p>
          
          <h2>What You&apos;ll Learn</h2>
          <ul>
            <li>How to research and locate accessible abandoned facilities</li>
            <li>Essential safety gear and protocols for medical facility exploration</li>
            <li>Historical context of mental health treatment and institutional care</li>
            <li>Techniques for <Link href="/tag/paranormal-investigation">paranormal investigation</Link> in hospital settings</li>
            <li>Photography tips for documenting your explorations</li>
            <li>Legal considerations and ethical exploration practices</li>
          </ul>
        </div>

        {/* Quick Stats */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-primary">{totalPosts}+</div>
            <div className="text-sm text-muted-foreground">Articles</div>
          </div>
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-primary">50+</div>
            <div className="text-sm text-muted-foreground">Locations Covered</div>
          </div>
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-primary">10</div>
            <div className="text-sm text-muted-foreground">Safety Guides</div>
          </div>
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-primary">15+</div>
            <div className="text-sm text-muted-foreground">Investigation Tips</div>
          </div>
        </div>

        {/* Featured Articles */}
        <section className="mb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Featured Articles</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start with these essential reads for asylum exploration.
            </p>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoryPosts.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>

        {/* Content Sections */}
        {sectionData.map((section) => {
          const Icon = section.icon;
          if (section.posts.length === 0) return null;
          
          return (
            <section key={section.id} id={section.id} className="mb-16 scroll-mt-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                  <h2 className="text-3xl font-bold">{section.title}</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
                  {section.description}
                </p>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {section.posts.slice(0, 3).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {/* All Posts Grid */}
        <section className="mb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">All Asylum & Hospital Articles</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {categoryPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            <div className="text-center">
              <Link href="/category/abandoned-asylums-hospitals">
                <Button size="lg">
                  View All {totalPosts} Articles
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Guides */}
        <section className="max-w-4xl mx-auto bg-muted/50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Continue Your Journey</h2>
          <p className="text-muted-foreground mb-6">
            Expand your exploration knowledge with these related guides.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/guides/paranormal-investigation">
              <Button variant="outline">Paranormal Investigation</Button>
            </Link>
            <Link href="/guides/ghost-hunting-equipment">
              <Button variant="outline">Equipment Guide</Button>
            </Link>
            <Link href="/guides/urban-exploration-safety">
              <Button variant="outline">Urban Exploration Safety</Button>
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
