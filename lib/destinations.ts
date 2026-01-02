// Destination data for landmark-specific tour pages
// These are specific attractions/landmarks rather than cities

export const VIATOR_PID = 'P00166886';

export interface Destination {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  country: string;
  city: string;
  citySlug: string; // Maps to lib/tours.ts city for fetching products
  imageUrl: string;
  viatorSearchQuery: string;
  viatorDestId: string; // Viator destination ID for the city/region
  highlights: string[];
  bestTimeToVisit: string;
  tips: string[];
}

// Helper to build optimized Unsplash URL
function unsplash(photoId: string, width: number = 1200, height: number = 800): string {
  return `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&fm=webp&q=80`;
}

export const destinations: Destination[] = [
  {
    id: 'draculas-castle',
    slug: 'draculas-castle',
    name: "Dracula's Castle",
    tagline: 'Where Legend Meets Reality',
    description: 'Explore Bran Castle in Transylvania, the legendary fortress associated with Vlad the Impaler and Bram Stoker\'s immortal vampire.',
    longDescription: `Perched dramatically on a cliff in the Carpathian Mountains, Bran Castle has captivated visitors for centuries. While its connection to Vlad the Impaler is tenuous at best, the castle's Gothic architecture and remote Transylvanian location made it the perfect inspiration for Bram Stoker's legendary vampire tale.

Today, the castle serves as a museum showcasing medieval artifacts, secret passages, and the dark history of the region. Ghost tours and night visits offer spine-chilling experiences as you explore the castle's shadowy corridors and learn about the real horrors of Vlad's brutal reign.`,
    country: 'Romania',
    city: 'Bran, Transylvania',
    citySlug: 'transylvania', // Maps to lib/tours.ts
    imageUrl: unsplash('photo-1580394693539-2eb89614e3f5', 1200, 800),
    viatorSearchQuery: 'dracula castle bran transylvania',
    viatorDestId: '22413', // Bucharest region
    highlights: [
      'Explore the castle that inspired Bram Stoker\'s Dracula',
      'Walk through secret passages and medieval chambers',
      'Learn about Vlad the Impaler\'s dark history',
      'Experience night tours with paranormal investigations',
      'Visit the Torture Museum in the castle basement',
    ],
    bestTimeToVisit: 'October for Halloween events, or spring/fall for smaller crowds',
    tips: [
      'Book night tours in advance - they sell out quickly',
      'Wear comfortable shoes for climbing steep stairs',
      'Visit on weekdays to avoid large tour groups',
      'Combine with a trip to nearby Râșnov Fortress',
    ],
  },
  {
    id: 'salem-witch-trials',
    slug: 'salem-witch-trials',
    name: 'Salem Witch Trials',
    tagline: 'Walk Where History\'s Darkest Chapter Unfolded',
    description: 'Experience the haunted streets of Salem, Massachusetts, where the infamous 1692 witch trials led to the execution of 20 innocent people.',
    longDescription: `Salem, Massachusetts stands as America's most notorious reminder of mass hysteria and injustice. In 1692, accusations of witchcraft tore through this Puritan community, resulting in the arrest of over 200 people and the execution of 20 innocent victims.

Today, Salem embraces its dark past with world-class museums, haunted walking tours, and preserved historic sites. The Salem Witch Museum, the Witch House, and the Witch Trials Memorial offer sobering reminders of this tragic chapter. Ghost tours reveal the restless spirits said to still wander the streets, while psychic readings and occult shops line Essex Street.`,
    country: 'USA',
    city: 'Salem, Massachusetts',
    citySlug: 'salem', // Maps to lib/tours.ts
    imageUrl: unsplash('photo-1509557965875-b88c97052f0e', 1200, 800),
    viatorSearchQuery: 'salem witch trials ghost tour',
    viatorDestId: '50249', // Salem
    highlights: [
      'Visit the Salem Witch Museum and Witch House',
      'Walk the streets where accused witches were arrested',
      'Pay respects at the Witch Trials Memorial',
      'Experience ghost tours through haunted locations',
      'Explore the Old Burying Point Cemetery',
    ],
    bestTimeToVisit: 'October for Haunted Happenings festival, or spring for fewer crowds',
    tips: [
      'Book tours well in advance during October',
      'Visit the Peabody Essex Museum for historical context',
      'Take a guided walking tour for the full experience',
      'Explore beyond the tourist areas for authentic history',
    ],
  },
  {
    id: 'tower-of-london',
    slug: 'tower-of-london',
    name: 'Tower of London',
    tagline: 'Nine Centuries of Royal Intrigue and Ghostly Legends',
    description: 'Discover the haunted history of England\'s most infamous fortress, where executions, torture, and political intrigue created centuries of ghostly tales.',
    longDescription: `For over 900 years, the Tower of London has served as a royal palace, prison, armory, and execution site. Its blood-soaked history includes the murders of the Princes in the Tower, the beheadings of Anne Boleyn and Lady Jane Grey, and countless other dark deeds.

The Tower is considered one of Britain's most haunted locations. Guards and visitors have reported seeing the headless ghost of Anne Boleyn, the White Lady in the White Tower, and the ghostly figures of the murdered princes. Night tours offer the chance to explore after dark, when the ancient stones seem to whisper secrets of those who suffered within.`,
    country: 'UK',
    city: 'London',
    citySlug: 'london', // Maps to lib/tours.ts
    imageUrl: unsplash('photo-1513635269975-59663e0ac1ad', 1200, 800),
    viatorSearchQuery: 'tower of london ghost tour',
    viatorDestId: '737', // London
    highlights: [
      'See the Crown Jewels in their fortified vault',
      'Explore the Bloody Tower and its dark history',
      'Learn about famous prisoners and executions',
      'Meet the legendary Yeoman Warders (Beefeaters)',
      'Experience after-hours ghost tours',
    ],
    bestTimeToVisit: 'Early morning or late afternoon to avoid peak crowds',
    tips: [
      'Book tickets online to skip the queue',
      'Join a Yeoman Warder tour for entertaining history',
      'Visit the Chapel Royal to see Anne Boleyn\'s burial site',
      'Allocate at least 3 hours for a full visit',
    ],
  },
];

// Get destination by slug
export function getDestinationBySlug(slug: string): Destination | undefined {
  return destinations.find(d => d.slug === slug);
}

// Get all destination slugs for static generation
export function getAllDestinationSlugs(): string[] {
  return destinations.map(d => d.slug);
}

// Build Viator affiliate search URL for a destination
export function getDestinationViatorUrl(destination: Destination): string {
  const searchUrl = `https://www.viator.com/searchResults/all?text=${encodeURIComponent(destination.viatorSearchQuery)}&destId=${destination.viatorDestId}&flags=FREE_CANCELLATION`;
  return `${searchUrl}&pid=${VIATOR_PID}`;
}
