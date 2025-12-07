import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { SiX, SiFacebook, SiLinkedin } from 'react-icons/si';
import { getPost, buildSeo, getAllPostSlugs, ViatorTour } from '@/lib/wordpress';
import { stripHtml, formatDate, getReadingTime, getFeaturedImage, getAuthor, getCategories_Post, getTags_Post } from '@/lib/wordpress';
import { sanitizeContent } from '@/lib/sanitize-content';
import { checkAndFixSpelling } from '@/lib/spell-checker';
import { OptimizedContent } from '@/components/optimized-content';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EnhancedPostSchema } from '@/components/Schema';

/**
 * Creates a slim inline CTA banner for early placement (after intro)
 */
function createSlimCTA(tour: ViatorTour): string {
  return `
    <div class="viator-slim-cta my-6 p-4 bg-gradient-to-r from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-xl">
      <a href="${tour.url}" target="_blank" rel="noopener noreferrer sponsored" class="flex items-center justify-between gap-4 text-white no-underline hover:no-underline">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🔮</span>
          <div>
            <span class="font-semibold">${tour.destination ? `Book a ghost tour in ${tour.destination}` : tour.title}</span>
            ${tour.rating ? `<span class="mx-2 text-yellow-400">★ ${tour.rating.toFixed(1)}</span>` : ''}
          </div>
        </div>
        <div class="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors">
          ${tour.price ? `From ${tour.price}` : 'View Tour'}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </div>
      </a>
    </div>
  `;
}

/**
 * Creates the full detailed CTA card for mid-content placement
 */
function createFullCTA(tour: ViatorTour): string {
  return `
    <div class="viator-cta-wrapper my-8" data-viator-tour='${JSON.stringify(tour).replace(/'/g, "&#39;")}'>
      <div class="bg-gradient-to-br from-purple-900/20 to-slate-900/40 border border-purple-500/30 rounded-lg p-6">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">🔮 Experience It Yourself</p>
            <h3 class="font-bold text-lg text-white mb-2">${tour.title}</h3>
            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-300 mb-4">
              ${tour.destination ? `<span class="flex items-center gap-1"><svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>${tour.destination}</span>` : ''}
              ${tour.rating ? `<span class="flex items-center gap-1"><svg class="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>${tour.rating.toFixed(1)}${tour.reviewCount ? ` <span class="text-gray-400">(${tour.reviewCount.toLocaleString()})</span>` : ''}</span>` : ''}
              ${tour.price ? `<span class="font-semibold text-green-400">From ${tour.price}</span>` : ''}
            </div>
            <a href="${tour.url}" target="_blank" rel="noopener noreferrer sponsored" class="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-full transition-all hover:scale-105">
              Book This Tour
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-700/50">Affiliate link – we may earn a commission at no extra cost to you.</p>
      </div>
    </div>
  `;
}

/**
 * Injects dual Viator CTAs into content:
 * 1. Slim banner after first </p> (catches early readers)
 * 2. Full card after first </h2> (catches engaged readers)
 */
function injectViatorCTAs(content: string, tour: ViatorTour | undefined): string {
  if (!tour || !tour.url) return content;
  
  let result = content;
  
  // Find first </p> for slim CTA (after intro paragraph)
  const pMatch = result.match(/<\/p>/i);
  if (pMatch && pMatch.index !== undefined) {
    const slimCta = createSlimCTA(tour);
    const insertPos = pMatch.index + pMatch[0].length;
    result = result.slice(0, insertPos) + slimCta + result.slice(insertPos);
  }
  
  // Find first </h2> for full CTA (after first heading)
  // Need to search in the modified content
  const h2Match = result.match(/<\/h2>/i);
  if (h2Match && h2Match.index !== undefined) {
    const fullCta = createFullCTA(tour);
    const insertPos = h2Match.index + h2Match[0].length;
    result = result.slice(0, insertPos) + fullCta + result.slice(insertPos);
  }
  
  return result;
}

/**
 * Category-specific inline images hosted on WordPress media library
 */
const WP_UPLOADS = 'https://wp.cursedtours.com/wp-content/uploads/2025/12';

const INLINE_IMAGES: Record<string, Array<{ url: string; alt: string }>> = {
  'abandoned-asylums-hospitals': [
    { url: `${WP_UPLOADS}/abandoned_asylum_dark_corridor.png`, alt: 'Abandoned asylum corridor with peeling paint and shadows' },
    { url: `${WP_UPLOADS}/asylum_corridor_with_wheelchair.png`, alt: 'Haunting asylum hallway with abandoned wheelchair' },
    { url: `${WP_UPLOADS}/abandoned_hospital_eerie_hallway.png`, alt: 'Dark abandoned psychiatric hospital hallway with flickering lights' },
    { url: `${WP_UPLOADS}/victorian_asylum_exterior_night.png`, alt: 'Crumbling Victorian asylum exterior at night with full moon' },
    { url: `${WP_UPLOADS}/abandoned_hospital_operating_room.png`, alt: 'Abandoned operating room with rusted surgical equipment' },
    { url: `${WP_UPLOADS}/mental_institution_dark_corridor.png`, alt: 'Long dark corridor in abandoned mental institution' },
    { url: `${WP_UPLOADS}/victorian_psychiatric_ward_beds.png`, alt: 'Victorian psychiatric ward with old hospital beds' },
    { url: `${WP_UPLOADS}/abandoned_orphanage_dormitory_beds.png`, alt: 'Abandoned orphanage dormitory with rows of old beds' },
    { url: `${WP_UPLOADS}/abandoned_sanatorium_rooftop_garden.png`, alt: 'Abandoned sanatorium rooftop garden overtaken by nature' },
    { url: `${WP_UPLOADS}/psychiatric_hospital_lobby_abandoned.png`, alt: 'Abandoned psychiatric hospital lobby with debris' },
    { url: `${WP_UPLOADS}/abandoned_morgue_metal_tables.png`, alt: 'Abandoned morgue with metal examination tables' },
  ],
  'haunted-castles-estates': [
    { url: `${WP_UPLOADS}/gothic_castle_with_moon.png`, alt: 'Gothic castle silhouette against moonlit sky' },
    { url: `${WP_UPLOADS}/haunted_victorian_ballroom.png`, alt: 'Abandoned Victorian ballroom with dusty chandeliers' },
    { url: `${WP_UPLOADS}/gothic_castle_midnight_storm.png`, alt: 'Ancient Gothic castle on cliff during lightning storm' },
    { url: `${WP_UPLOADS}/haunted_mansion_grand_staircase-1.png`, alt: 'Haunted Victorian mansion grand staircase with supernatural mist' },
    { url: `${WP_UPLOADS}/haunted_victorian_mansion_night.png`, alt: 'Haunted Victorian mansion at night with eerie glow' },
    { url: `${WP_UPLOADS}/victorian_seance_room.png`, alt: 'Victorian seance room with mysterious atmosphere' },
    { url: `${WP_UPLOADS}/spiral_staircase_dark_mansion.png`, alt: 'Spiral staircase in dark Victorian mansion' },
    { url: `${WP_UPLOADS}/victorian_attic_dusty_cobwebs.png`, alt: 'Victorian attic filled with dusty furniture and cobwebs' },
    { url: `${WP_UPLOADS}/abandoned_ballroom_grand_piano.png`, alt: 'Abandoned ballroom with grand piano covered in dust' },
    { url: `${WP_UPLOADS}/haunted_mansion_garden_maze.png`, alt: 'Haunted mansion garden maze shrouded in fog' },
    { url: `${WP_UPLOADS}/crumbling_tower_spiral_staircase.png`, alt: 'Crumbling tower with spiral staircase and supernatural light' },
    { url: `${WP_UPLOADS}/grandfather_clock_dark_hallway.png`, alt: 'Grandfather clock in dark hallway casting eerie shadows' },
    { url: `${WP_UPLOADS}/victorian_supernatural_mirror_reflection.png`, alt: 'Victorian mirror showing supernatural reflection' },
    { url: `${WP_UPLOADS}/creepy_victorian_nursery_room.png`, alt: 'Creepy Victorian nursery room with old toys' },
  ],
  'ghost-hunting-techniques-tools': [
    { url: `${WP_UPLOADS}/ghost_hunting_equipment_display.png`, alt: 'Professional paranormal investigation equipment' },
    { url: `${WP_UPLOADS}/investigator_with_emf_meter.png`, alt: 'Ghost hunter using EMF detection equipment' },
    { url: `${WP_UPLOADS}/ghost_hunting_equipment_table.png`, alt: 'Ghost hunting equipment laid out on table' },
    { url: `${WP_UPLOADS}/investigator_silhouette_flashlight.png`, alt: 'Paranormal investigator silhouette with flashlight in dark building' },
    { url: `${WP_UPLOADS}/evp_recording_seance_setup.png`, alt: 'EVP recording session setup with vintage equipment' },
    { url: `${WP_UPLOADS}/thermal_imaging_paranormal_view.png`, alt: 'Thermal imaging camera view showing paranormal cold spots' },
    { url: `${WP_UPLOADS}/evp_spirit_communication_equipment.png`, alt: 'EVP spirit communication equipment setup' },
    { url: `${WP_UPLOADS}/seance_table_ouija_crystal.png`, alt: 'Seance table with ouija board and crystal ball' },
    { url: `${WP_UPLOADS}/old_photograph_darkroom_red.png`, alt: 'Old photograph darkroom with red lighting' },
  ],
  'historical-hauntings-insights': [
    { url: `${WP_UPLOADS}/historical_haunting_victorian_sepia.png`, alt: 'Historical Victorian era haunting scene in sepia tones' },
    { url: `${WP_UPLOADS}/victorian_seance_room_crystal.png`, alt: 'Old Victorian seance room with crystal ball and candles' },
    { url: `${WP_UPLOADS}/abandoned_church_gothic_interior.png`, alt: 'Abandoned church interior with shattered stained glass' },
    { url: `${WP_UPLOADS}/underground_crypt_stone_tombs.png`, alt: 'Underground crypt with ancient stone tombs and flickering torches' },
    { url: `${WP_UPLOADS}/ancient_catacombs_skull_walls.png`, alt: 'Ancient catacombs with skull-lined walls' },
    { url: `${WP_UPLOADS}/abandoned_chapel_candlelight_shadows.png`, alt: 'Abandoned chapel with candlelight casting shadows' },
    { url: `${WP_UPLOADS}/ancient_burial_ground_ravens.png`, alt: 'Ancient burial ground with ravens perched on stones' },
    { url: `${WP_UPLOADS}/foggy_moor_standing_stones.png`, alt: 'Foggy moor with ancient standing stones' },
    { url: `${WP_UPLOADS}/old_apothecary_mysterious_potions.png`, alt: 'Old apothecary shop with mysterious potions and bottles' },
  ],
  'urban-exploration-paranormal': [
    { url: `${WP_UPLOADS}/abandoned_industrial_urban_exploration.png`, alt: 'Abandoned industrial building for urban exploration' },
    { url: `${WP_UPLOADS}/haunted_hotel_corridor_vintage.png`, alt: 'Haunted hotel corridor with vintage wallpaper and flickering lights' },
    { url: `${WP_UPLOADS}/creepy_doll_room_abandoned.png`, alt: 'Creepy doll room in abandoned house with vintage dolls' },
    { url: `${WP_UPLOADS}/abandoned_haunted_theater_stage.png`, alt: 'Abandoned haunted theater with empty stage' },
    { url: `${WP_UPLOADS}/abandoned_train_station_fog.png`, alt: 'Abandoned train station shrouded in fog' },
    { url: `${WP_UPLOADS}/abandoned_prison_cell_block.png`, alt: 'Abandoned prison cell block with rusted bars' },
    { url: `${WP_UPLOADS}/abandoned_carnival_night_horror.png`, alt: 'Abandoned carnival at night with horror atmosphere' },
    { url: `${WP_UPLOADS}/abandoned_schoolhouse_eerie_interior.png`, alt: 'Abandoned schoolhouse with eerie interior' },
    { url: `${WP_UPLOADS}/abandoned_mine_shaft_entrance.png`, alt: 'Abandoned mine shaft entrance in darkness' },
    { url: `${WP_UPLOADS}/abandoned_victorian_greenhouse_fog.png`, alt: 'Abandoned Victorian greenhouse filled with fog' },
    { url: `${WP_UPLOADS}/old_wine_cellar_cobwebs.png`, alt: 'Old wine cellar with dusty bottles and cobwebs' },
    { url: `${WP_UPLOADS}/haunted_old_library_supernatural.png`, alt: 'Haunted old library with supernatural presence' },
  ],
  'default': [
    { url: `${WP_UPLOADS}/misty_dark_forest_supernatural.png`, alt: 'Mysterious misty forest with supernatural atmosphere' },
    { url: `${WP_UPLOADS}/foggy_cemetery_at_midnight.png`, alt: 'Foggy cemetery at midnight with ancient tombstones' },
    { url: `${WP_UPLOADS}/dark_forest_supernatural_path.png`, alt: 'Dark forest path at night with twisted trees and supernatural mist' },
    { url: `${WP_UPLOADS}/haunted_lighthouse_storm_night.png`, alt: 'Abandoned lighthouse on rocky shore during night storm' },
    { url: `${WP_UPLOADS}/misty_graveyard_midnight_fog.png`, alt: 'Misty graveyard at midnight with fog rolling between graves' },
    { url: `${WP_UPLOADS}/stormy_abandoned_lighthouse.png`, alt: 'Stormy abandoned lighthouse with dramatic atmosphere' },
    { url: `${WP_UPLOADS}/haunted_forest_path.png`, alt: 'Haunted forest path with eerie supernatural presence' },
    { url: `${WP_UPLOADS}/mysterious_shrine_in_fog.png`, alt: 'Mysterious shrine shrouded in supernatural fog' },
    { url: `${WP_UPLOADS}/supernatural_glowing_well_forest.png`, alt: 'Supernatural glowing well in dark forest' },
    { url: `${WP_UPLOADS}/haunted_covered_bridge_fog.png`, alt: 'Haunted covered bridge shrouded in fog' },
  ],
};

/**
 * Inserts inline images throughout the content for visual engagement.
 * Places images after every N sections (h2/h3 headings) to break up long text.
 */
function insertInlineImages(content: string, categorySlug?: string, interval: number = 2): string {
  // Split content by headings to find insertion points
  const headingPattern = /<\/h[23]>/gi;
  const matches = [...content.matchAll(headingPattern)];
  
  if (matches.length < interval) return content;
  
  // Get category-specific images or fall back to default
  const images = (categorySlug && INLINE_IMAGES[categorySlug]) || INLINE_IMAGES['default'];
  let result = content;
  let offset = 0;
  let imageIndex = 0;
  
  matches.forEach((match, index) => {
    // Insert image after every N headings (skip first one)
    if ((index + 1) % interval === 0 && match.index !== undefined) {
      const image = images[imageIndex % images.length];
      const insertPos = match.index + match[0].length + offset;
      
      const imageHtml = `
        <figure class="inline-image my-8 rounded-xl overflow-hidden">
          <img 
            src="${image.url}" 
            alt="${image.alt}"
            class="w-full h-auto rounded-xl"
            loading="lazy"
          />
          <figcaption class="text-sm text-gray-400 mt-2 text-center italic">${image.alt}</figcaption>
        </figure>
      `;
      
      result = result.slice(0, insertPos) + imageHtml + result.slice(insertPos);
      offset += imageHtml.length;
      imageIndex++;
    }
  });
  
  return result;
}

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getAllPostSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // Return empty array to allow dynamic generation at request time
    return [];
  }
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const { post } = await getPost(slug);
    const seo = buildSeo(post);

    return {
      title: seo.title,
      description: seo.description,
      alternates: {
        canonical: seo.canonical,
      },
      openGraph: {
        title: seo.ogTitle,
        description: seo.ogDescription,
        type: 'article',
        url: seo.canonical,
        images: [{
          url: seo.ogImage,
          alt: seo.altText,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: seo.ogTitle,
        description: seo.ogDescription,
        images: [seo.ogImage],
      },
    };
  } catch {
    return { title: 'Post Not Found' };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  let data;
  try {
    data = await getPost(slug);
  } catch {
    notFound();
  }

  const { post, relatedPosts } = data;
  const author = getAuthor(post);
  const categories = getCategories_Post(post);
  const tags = getTags_Post(post);
  const featuredImage = getFeaturedImage(post, 'large');
  const title = stripHtml(post.title.rendered);
  const readingTime = getReadingTime(post.content.rendered);

  const processedContent = sanitizeContent(
    injectViatorCTAs(post.content.rendered, post.meta?.viator_tour)
  );
  const { correctedText: spellCheckedContent } = await checkAndFixSpelling(processedContent);
  const categorySlug = categories.length > 0 ? categories[0].slug : undefined;
  const finalContent = insertInlineImages(spellCheckedContent, categorySlug, 2);

  const shareUrl = `https://www.cursedtours.com/post/${post.slug}`;
  const shareText = encodeURIComponent(title);

  return (
    <article className="min-h-screen">
      <EnhancedPostSchema post={post} />
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-2" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to articles
          </Button>
        </Link>

        <header className="max-w-4xl mx-auto mb-8">
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <Badge
                    className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-xs uppercase tracking-wider font-semibold"
                    data-testid={`badge-category-${cat.id}`}
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight" data-testid="post-title">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            {author && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={author.avatar_urls?.['48']} alt={author.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{author.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readingTime} min read
              </span>
            </div>
          </div>
        </header>

        {featuredImage && (
          <div className="max-w-5xl mx-auto mb-12">
            <div className="aspect-[16/9] relative overflow-hidden rounded-3xl bg-muted">
              <Image
                src={featuredImage.url}
                alt={featuredImage.alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                data-testid="post-featured-image"
              />
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <OptimizedContent 
            html={finalContent}
            className="wp-content"
          />

          {tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-sm"
                    data-testid={`badge-tag-${tag.id}`}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Share this article</h3>
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                data-testid="share-twitter"
              >
                <SiX className="h-5 w-5" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                data-testid="share-facebook"
              >
                <SiFacebook className="h-5 w-5" />
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                data-testid="share-linkedin"
              >
                <SiLinkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {author && (
            <div className="mt-12 p-6 rounded-3xl bg-muted/50">
              <div className="flex gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={author.avatar_urls?.['96']} alt={author.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xl">
                    {author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{author.name}</h3>
                  {author.description && (
                    <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeContent(author.description) }} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {relatedPosts.length > 0 && (
          <section className="mt-16 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedPosts.map((relatedPost) => (
                <PostCard key={relatedPost.id} post={relatedPost} variant="featured" />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
