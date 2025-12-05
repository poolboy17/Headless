import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Radio, Mic, Camera, Thermometer, Gauge, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPosts } from '@/lib/wordpress';
import { PostCard } from '@/components/post-card';

export const metadata: Metadata = {
  title: 'Ghost Hunting Equipment Guide: Essential Tools for Paranormal Investigation | Cursed Tours',
  description: 'Complete guide to ghost hunting equipment. Learn about EMF meters, EVP recorders, spirit boxes, thermal cameras, and more essential paranormal investigation tools.',
  keywords: ['ghost hunting equipment', 'EMF meter', 'EVP recorder', 'spirit box', 'thermal camera', 'paranormal investigation tools'],
  openGraph: {
    title: 'Ghost Hunting Equipment Guide',
    description: 'Essential tools and technology for serious paranormal investigators.',
    type: 'article',
  },
};

const EQUIPMENT_CATEGORIES = [
  {
    id: 'emf-detection',
    title: 'EMF Detection',
    description: 'Electromagnetic field meters detect fluctuations that may indicate paranormal presence',
    icon: Gauge,
    tag: 'emf-meter',
    details: 'EMF meters are essential for detecting electromagnetic field anomalies often associated with spirit activity.',
  },
  {
    id: 'audio-recording',
    title: 'Audio & EVP Recording',
    description: 'Capture Electronic Voice Phenomena and unexplained sounds',
    icon: Mic,
    tag: 'evp',
    details: 'Digital voice recorders and specialized EVP equipment can capture voices and sounds beyond normal hearing.',
  },
  {
    id: 'visual-documentation',
    title: 'Visual Documentation',
    description: 'Cameras and video equipment for capturing visual evidence',
    icon: Camera,
    tag: 'ghost-hunting',
    details: 'Full-spectrum cameras, infrared, and night vision equipment help document visual anomalies.',
  },
  {
    id: 'environmental',
    title: 'Environmental Sensors',
    description: 'Temperature and atmospheric monitoring equipment',
    icon: Thermometer,
    tag: 'paranormal-investigation',
    details: 'Cold spots and atmospheric changes are common indicators of paranormal activity.',
  },
];

export default async function GhostHuntingEquipmentGuidePage() {
  // Fetch posts for each equipment category
  const sectionData = await Promise.all(
    EQUIPMENT_CATEGORIES.map(async (category) => {
      const { posts } = await getPosts({ tag: category.tag, perPage: 4 });
      return { ...category, posts };
    })
  );

  // Get all equipment-related posts
  const { posts: allPosts, totalPosts } = await getPosts({ 
    tag: 'ghost-hunting', 
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
            name: 'Ghost Hunting Equipment Guide',
            description: 'Complete guide to paranormal investigation equipment and tools.',
            url: 'https://www.cursedtours.com/guides/ghost-hunting-equipment',
            author: { '@type': 'Organization', name: 'Cursed Tours' },
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

        {/* Hero */}
        <header className="max-w-4xl mx-auto mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Radio className="h-4 w-4" />
            Equipment Guide
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Ghost Hunting Equipment Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The right tools can make the difference between a successful investigation 
            and a missed opportunity. Learn about essential paranormal detection equipment.
          </p>
        </header>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert mb-16">
          <p>
            Professional paranormal investigators rely on specialized equipment to detect, 
            document, and analyze supernatural phenomena. While no device can definitively 
            prove the existence of ghosts, these tools help create a more scientific 
            approach to <Link href="/guides/paranormal-investigation">paranormal investigation</Link>.
          </p>
          <p>
            This guide covers the essential equipment categories, from entry-level options 
            for beginners to professional-grade tools used by experienced investigators. 
            Whether you&apos;re exploring <Link href="/guides/abandoned-asylums">abandoned asylums</Link> or 
            investigating a local haunted location, having the right gear is crucial.
          </p>
        </div>

        {/* Equipment Categories */}
        {sectionData.map((category) => {
          const Icon = category.icon;
          return (
            <section key={category.id} id={category.id} className="mb-16 scroll-mt-8">
              <div className="max-w-6xl mx-auto">
                <div className="bg-muted/30 rounded-xl p-8 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{category.title}</h2>
                      <p className="text-muted-foreground mb-4">{category.description}</p>
                      <p className="text-sm">{category.details}</p>
                    </div>
                  </div>
                </div>
                
                {category.posts.length > 0 && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {category.posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* Beginner Recommendations */}
        <section className="max-w-4xl mx-auto mb-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Starter Kit Recommendations</h2>
          <p className="text-muted-foreground mb-6">
            New to ghost hunting? Start with these essential items:
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <Gauge className="h-5 w-5 text-primary" />
              <span><strong>K-II EMF Meter</strong> - Affordable and reliable entry-level EMF detector</span>
            </li>
            <li className="flex items-center gap-3">
              <Mic className="h-5 w-5 text-primary" />
              <span><strong>Digital Voice Recorder</strong> - For capturing EVP sessions</span>
            </li>
            <li className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-primary" />
              <span><strong>Night Vision Camera</strong> - Document in low-light conditions</span>
            </li>
            <li className="flex items-center gap-3">
              <Thermometer className="h-5 w-5 text-primary" />
              <span><strong>Infrared Thermometer</strong> - Detect temperature anomalies</span>
            </li>
            <li className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <span><strong>Flashlight with backup batteries</strong> - Never explore without light</span>
            </li>
          </ul>
        </section>

        {/* All Posts */}
        <section className="mb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Equipment & Technique Articles</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {allPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            <div className="text-center">
              <Link href="/tag/ghost-hunting">
                <Button size="lg">View All Equipment Articles</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Guides */}
        <section className="max-w-4xl mx-auto bg-muted/50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Related Guides</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/guides/paranormal-investigation">
              <Button variant="outline">Investigation Guide</Button>
            </Link>
            <Link href="/guides/abandoned-asylums">
              <Button variant="outline">Abandoned Asylums</Button>
            </Link>
            <Link href="/guides/urban-exploration-safety">
              <Button variant="outline">Safety Guide</Button>
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
