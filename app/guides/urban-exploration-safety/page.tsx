import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle, HardHat, Users, Scale, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPosts } from '@/lib/wordpress';
import { PostCard } from '@/components/post-card';

export const metadata: Metadata = {
  title: 'Urban Exploration Safety Guide: Stay Safe While Exploring | Cursed Tours',
  description: 'Essential safety guide for urban explorers and paranormal investigators. Learn about protective gear, hazard identification, legal considerations, and emergency preparedness.',
  keywords: ['urban exploration safety', 'urbex safety', 'abandoned building safety', 'exploration gear', 'trespassing laws'],
  openGraph: {
    title: 'Urban Exploration Safety Guide',
    description: 'Stay safe while exploring abandoned locations with these essential safety protocols.',
    type: 'article',
  },
};

const SAFETY_TOPICS = [
  {
    id: 'protective-gear',
    title: 'Protective Gear',
    description: 'Essential equipment to protect yourself from physical hazards',
    icon: HardHat,
    tag: 'safety-tips',
    checklist: [
      'Sturdy boots with ankle support',
      'Work gloves for handling debris',
      'N95 or P100 respirator mask',
      'Safety glasses or goggles',
      'Hard hat for structural hazards',
      'Long pants and sleeves',
    ],
  },
  {
    id: 'hazard-awareness',
    title: 'Hazard Awareness',
    description: 'Identify and avoid common dangers in abandoned structures',
    icon: AlertTriangle,
    tag: 'abandoned-sites',
    checklist: [
      'Unstable floors and staircases',
      'Asbestos in old insulation',
      'Lead paint contamination',
      'Broken glass and sharp metal',
      'Mold and biological hazards',
      'Electrical dangers',
    ],
  },
  {
    id: 'team-protocols',
    title: 'Team Protocols',
    description: 'Never explore alone - team safety practices',
    icon: Users,
    tag: 'urban-exploration',
    checklist: [
      'Always explore with a partner',
      'Share your location with someone outside',
      'Establish check-in times',
      'Carry two-way radios',
      'Know each team member\'s skills',
      'Have an emergency action plan',
    ],
  },
  {
    id: 'legal-considerations',
    title: 'Legal Considerations',
    description: 'Understand trespassing laws and property rights',
    icon: Scale,
    tag: 'ghost-hunting',
    checklist: [
      'Research local trespassing laws',
      'Seek permission when possible',
      'Respect No Trespassing signs',
      'Never break locks or damage property',
      'Carry ID at all times',
      'Know your rights if confronted',
    ],
  },
  {
    id: 'emergency-prep',
    title: 'Emergency Preparedness',
    description: 'Be ready for medical emergencies and accidents',
    icon: Heart,
    tag: 'safety-tips',
    checklist: [
      'Carry a comprehensive first aid kit',
      'Know basic first aid procedures',
      'Have emergency contacts saved',
      'Bring extra water and snacks',
      'Carry a charged phone and backup battery',
      'Know the nearest hospital location',
    ],
  },
];

export default async function UrbanExplorationSafetyGuidePage() {
  // Fetch safety-related posts
  const { posts: safetyPosts, totalPosts } = await getPosts({ 
    tag: 'safety-tips', 
    perPage: 6 
  });

  // Fetch urban exploration posts
  const { posts: urbexPosts } = await getPosts({ 
    tag: 'urban-exploration', 
    perPage: 6 
  });

  const allPosts = [...safetyPosts, ...urbexPosts].slice(0, 9);

  return (
    <article className="min-h-screen">
      {/* Schema.org Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Guide',
            name: 'Urban Exploration Safety Guide',
            description: 'Comprehensive safety guide for urban explorers and paranormal investigators.',
            url: 'https://cursedtours.com/guides/urban-exploration-safety',
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
          <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="h-4 w-4" />
            Safety First
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Urban Exploration Safety Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The most thrilling adventure isn&apos;t worth risking your life. 
            Master these essential safety protocols before exploring any abandoned location.
          </p>
        </header>

        {/* Critical Warning */}
        <div className="max-w-3xl mx-auto mb-12 bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-red-500 mb-2">Critical Safety Notice</h2>
              <p className="text-sm">
                Abandoned buildings are inherently dangerous. Structural collapse, toxic materials, 
                and other hazards can cause serious injury or death. Always prioritize safety over 
                exploration. If a situation feels unsafe, leave immediately. No photograph or 
                experience is worth your life.
              </p>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert mb-16">
          <p>
            Urban exploration (urbex) and <Link href="/guides/paranormal-investigation">paranormal investigation</Link> take 
            you into environments that weren&apos;t designed for visitors. <Link href="/guides/abandoned-asylums">Abandoned 
            asylums</Link>, derelict factories, and forgotten hospitals present unique challenges 
            that require careful preparation and constant vigilance.
          </p>
          <p>
            This guide compiles essential safety knowledge from experienced explorers. 
            Following these protocols significantly reduces your risk while allowing you 
            to enjoy the fascinating world of abandoned places.
          </p>
        </div>

        {/* Safety Topics */}
        {SAFETY_TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <section key={topic.id} id={topic.id} className="mb-12 scroll-mt-8">
              <div className="max-w-4xl mx-auto">
                <div className="bg-muted/30 rounded-xl p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{topic.title}</h2>
                      <p className="text-muted-foreground">{topic.description}</p>
                    </div>
                  </div>
                  
                  <div className="bg-background/50 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Checklist:</h3>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {topic.checklist.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Before You Go Checklist */}
        <section className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Pre-Exploration Checklist</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Research</h3>
                <ul className="space-y-2 text-sm">
                  <li>☐ Location history and known hazards</li>
                  <li>☐ Legal status and property ownership</li>
                  <li>☐ Recent reports from other explorers</li>
                  <li>☐ Weather conditions for the day</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Gear</h3>
                <ul className="space-y-2 text-sm">
                  <li>☐ All protective equipment checked</li>
                  <li>☐ Flashlights with fresh batteries</li>
                  <li>☐ Phone fully charged + backup battery</li>
                  <li>☐ First aid kit stocked</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Communication</h3>
                <ul className="space-y-2 text-sm">
                  <li>☐ Team assembled and briefed</li>
                  <li>☐ Outside contact notified</li>
                  <li>☐ Check-in times established</li>
                  <li>☐ Emergency plan reviewed</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">On Site</h3>
                <ul className="space-y-2 text-sm">
                  <li>☐ Entry/exit points identified</li>
                  <li>☐ Initial hazard assessment done</li>
                  <li>☐ Time limit set for exploration</li>
                  <li>☐ Leave no trace principles followed</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        <section className="mb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Safety & Exploration Articles</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {allPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            <div className="text-center">
              <Link href="/tag/safety-tips">
                <Button size="lg">View All Safety Articles</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Guides */}
        <section className="max-w-4xl mx-auto bg-muted/50 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Explore More Guides</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/guides/paranormal-investigation">
              <Button variant="outline">Investigation Guide</Button>
            </Link>
            <Link href="/guides/abandoned-asylums">
              <Button variant="outline">Abandoned Asylums</Button>
            </Link>
            <Link href="/guides/ghost-hunting-equipment">
              <Button variant="outline">Equipment Guide</Button>
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
