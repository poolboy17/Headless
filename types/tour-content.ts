// Types for structured tour page content
// Replit generates this JSON, Next.js renders it with consistent styling

export type ContentSection =
  | IntroSection
  | HeadingSection
  | ParagraphSection
  | ListSection
  | ImageSection
  | QuoteSection
  | HighlightSection;

export interface IntroSection {
  type: "intro";
  content: string;
}

export interface HeadingSection {
  type: "heading";
  level: 2 | 3 | 4;
  content: string;
}

export interface ParagraphSection {
  type: "paragraph";
  content: string;
}

export interface ListSection {
  type: "list";
  style: "bullet" | "numbered";
  items: string[];
}

export interface ImageSection {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
}

export interface QuoteSection {
  type: "quote";
  content: string;
  attribution?: string;
}

export interface HighlightSection {
  type: "highlight";
  title?: string;
  content: string;
  style: "info" | "warning" | "tip";
}

// Full tour page JSON structure that Replit should generate
export interface TourPageData {
  productCode: string;
  slug: string;
  title: string;
  destination: string;
  excerpt: string;

  // Media
  featuredImage: {
    url: string;
    alt: string;
  };

  // Tour metadata
  price: number;
  currency: string;
  duration: string; // e.g., "2 hours", "3-4 hours"
  durationMinutes: number;
  rating: number;
  reviewCount: number;

  // Structured content sections
  sections: ContentSection[];

  // Tour details
  details: {
    inclusions: string[];
    exclusions: string[];
    meetingPoint?: string;
    accessibility?: string;
    cancellationPolicy?: string;
    languages?: string[];
  };

  // FAQs
  faqs: Array<{
    question: string;
    answer: string;
  }>;

  // Related tours (by product code)
  relatedTours?: string[];

  // SEO
  metaDescription?: string;
  focusKeyphrase?: string;

  // Booking
  bookingUrl: string;
}

// Example JSON for Replit reference:
/*
{
  "productCode": "12345P1",
  "slug": "savannah-ghost-pub-crawl",
  "title": "Ghosts and Toasts: Haunted Pub Crawl",
  "destination": "Savannah",
  "excerpt": "Explore Savannah's most haunted bars while enjoying local craft beers and spine-tingling ghost stories.",
  "featuredImage": {
    "url": "https://...",
    "alt": "Historic Savannah pub at night"
  },
  "price": 35.00,
  "currency": "USD",
  "duration": "2 hours",
  "durationMinutes": 120,
  "rating": 4.8,
  "reviewCount": 342,
  "sections": [
    {
      "type": "intro",
      "content": "Savannah is one of America's most haunted cities, and what better way to explore its supernatural side than with a drink in hand?"
    },
    {
      "type": "heading",
      "level": 2,
      "content": "What to Expect"
    },
    {
      "type": "paragraph",
      "content": "Your journey begins at Reynolds Square, where your expert guide will lead you through cobblestone streets..."
    },
    {
      "type": "list",
      "style": "bullet",
      "items": [
        "Visit 4 haunted pubs with documented paranormal activity",
        "Hear chilling stories from Savannah's dark past",
        "Enjoy 2 complimentary drinks included in your tour"
      ]
    },
    {
      "type": "heading",
      "level": 2,
      "content": "The Haunted History"
    },
    {
      "type": "paragraph",
      "content": "During the Yellow Fever epidemic of 1820, many of these buildings served as makeshift hospitals..."
    }
  ],
  "details": {
    "inclusions": ["Professional guide", "2 drinks included", "Ghost hunting equipment demo"],
    "exclusions": ["Gratuities", "Additional drinks", "Transportation"],
    "meetingPoint": "Reynolds Square, next to the John Wesley statue",
    "accessibility": "Not wheelchair accessible - involves stairs"
  },
  "faqs": [
    {
      "question": "Is this tour scary?",
      "answer": "The tour focuses on historical ghost stories. It's spooky but appropriate for most adults."
    },
    {
      "question": "What's the minimum age?",
      "answer": "21+ only, as this tour visits bars and includes alcoholic beverages."
    }
  ],
  "bookingUrl": "https://www.viator.com/tours/Savannah/...",
  "metaDescription": "Join Savannah's most popular haunted pub crawl. Visit 4 haunted bars, hear ghost stories, and enjoy 2 drinks included."
}
*/
