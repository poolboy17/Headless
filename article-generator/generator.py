#!/usr/bin/env python3
"""
Cursed Tours AI Article Generator

Uses Ollama (local) to generate engaging articles from tour product data
and publishes them to WordPress.
"""

import os
import json
import base64
import requests
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
PRODUCTS_API_URL = os.getenv("PRODUCTS_API_URL", "https://viator-haunts--genaromvasquez.replit.app")
WORDPRESS_URL = os.getenv("WORDPRESS_URL", "https://wp.cursedtours.com")
WP_USERNAME = os.getenv("WP_USERNAME", "genaromvasquez@gmail.com")
WP_APP_PASSWORD = os.getenv("WP_APP_PASSWORD", "32ka wCd3 jX3H 237K k7qK 4IyI")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
SITE_URL = os.getenv("SITE_URL", "https://cursedtours.com")


class ProductsAPI:
    """Client for the Cursed Tours Products API"""

    def __init__(self, base_url: str = PRODUCTS_API_URL):
        self.base_url = base_url

    def get_products(self, niche: str = "haunted", limit: int = 50, offset: int = 0) -> Dict:
        """Fetch products from the API"""
        url = f"{self.base_url}/api/niches/{niche}/products"
        response = requests.get(url, params={"limit": limit, "offset": offset})
        response.raise_for_status()
        return response.json()

    def get_product_by_code(self, product_code: str) -> Dict:
        """Fetch a single product by Viator code"""
        url = f"{self.base_url}/api/products/code/{product_code}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def get_product_by_id(self, product_id: str) -> Dict:
        """Fetch a single product by database ID"""
        url = f"{self.base_url}/api/products/{product_id}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def search_by_destination(self, destination: str, niche: str = "haunted", limit: int = 20) -> List[Dict]:
        """Search for products by destination"""
        data = self.get_products(niche=niche, limit=100)
        products = data.get("products", [])

        matching = [
            p for p in products
            if destination.lower() in (p.get("destinationName") or "").lower()
        ]
        return matching[:limit]

    def get_top_rated(self, niche: str = "haunted", min_rating: float = 4.5, limit: int = 10) -> List[Dict]:
        """Get top-rated products"""
        data = self.get_products(niche=niche, limit=100)
        products = data.get("products", [])

        top = [
            p for p in products
            if (p.get("rating") or 0) >= min_rating and p.get("isActive")
        ]
        top.sort(key=lambda x: (x.get("rating") or 0, x.get("reviewCount") or 0), reverse=True)
        return top[:limit]


class OllamaClient:
    """Client for local Ollama API"""

    def __init__(self, base_url: str = OLLAMA_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url
        self.model = model

    def is_available(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False

    def list_models(self) -> List[str]:
        """List available models"""
        try:
            response = requests.get(f"{self.base_url}/api/tags")
            data = response.json()
            return [m["name"] for m in data.get("models", [])]
        except:
            return []

    def generate(self, prompt: str, system: str = None, max_tokens: int = 3000) -> str:
        """Generate text using Ollama"""
        url = f"{self.base_url}/api/generate"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": max_tokens,
            }
        }

        if system:
            payload["system"] = system

        response = requests.post(url, json=payload, timeout=180)
        response.raise_for_status()

        data = response.json()
        return data.get("response", "")


class WordPressClient:
    """Client for WordPress REST API"""

    def __init__(self, base_url: str = WORDPRESS_URL, username: str = WP_USERNAME, password: str = WP_APP_PASSWORD):
        self.base_url = base_url
        self.api_url = f"{base_url}/wp-json/wp/v2"
        self.auth = base64.b64encode(f"{username}:{password}".encode()).decode()

    def _headers(self) -> Dict:
        return {
            "Authorization": f"Basic {self.auth}",
            "Content-Type": "application/json"
        }

    def create_post(self, title: str, content: str, status: str = "draft",
                    featured_media: int = None, categories: List[int] = None,
                    tags: List[int] = None, meta: Dict = None, excerpt: str = None) -> Dict:
        """Create a new WordPress post"""
        url = f"{self.api_url}/posts"

        payload = {
            "title": title,
            "content": content,
            "status": status,
        }

        if featured_media:
            payload["featured_media"] = featured_media
        if categories:
            payload["categories"] = categories
        if tags:
            payload["tags"] = tags
        if meta:
            payload["meta"] = meta
        if excerpt:
            payload["excerpt"] = excerpt

        response = requests.post(url, json=payload, headers=self._headers())
        response.raise_for_status()
        return response.json()

    def upload_image(self, image_url: str, title: str) -> Optional[int]:
        """Upload an image from URL to WordPress media library"""
        try:
            img_response = requests.get(image_url, timeout=30)
            img_response.raise_for_status()

            content_type = img_response.headers.get("content-type", "image/jpeg")
            ext = "png" if "png" in content_type else "jpg"
            filename = f"{title.lower().replace(' ', '-')[:50]}.{ext}"

            url = f"{self.api_url}/media"
            headers = {
                "Authorization": f"Basic {self.auth}",
                "Content-Type": content_type,
                "Content-Disposition": f'attachment; filename="{filename}"'
            }

            response = requests.post(url, data=img_response.content, headers=headers)
            response.raise_for_status()

            return response.json().get("id")
        except Exception as e:
            print(f"Failed to upload image: {e}")
            return None


class ArticleGenerator:
    """Main article generator with rich, unique content - December 2025 SEO optimized"""

    # December 2025 SEO-focused system prompt with E-E-A-T signals
    SYSTEM_PROMPT = """You are a senior paranormal tourism content specialist for Cursed Tours with 10+ years of experience investigating haunted locations across America.

YOUR EXPERTISE:
- You have personally visited hundreds of haunted locations
- You understand historical research and primary sources
- You write with first-hand knowledge and authentic experience
- You balance atmospheric storytelling with factual accuracy

WRITING GUIDELINES (December 2025 SEO Best Practices):
1. E-E-A-T SIGNALS: Write with demonstrable expertise and first-hand experience
2. HELPFUL CONTENT: Every sentence must provide value - no filler
3. SEARCH INTENT: Blend informational content with clear transactional CTAs
4. SEMANTIC SEO: Use related entities, synonyms, and topically relevant terms
5. FEATURED SNIPPETS: Structure content for position zero (definitions, lists, tables)
6. VOICE SEARCH: Include conversational, question-based phrases
7. PASSAGE INDEXING: Create clear, self-contained sections with descriptive headers
8. NO EMOJIS: Professional, credible tone throughout

Format all output as WordPress Gutenberg blocks."""

    # Comprehensive tour article with December 2025 SEO tactics
    PRODUCT_SPLASH_TEMPLATE = """Create a comprehensive, SEO-optimized product page for this haunted tour.
This content must be UNIQUE, valuable, and optimized for December 2025 search algorithms.

=== TOUR DATA ===
TITLE: {title}
LOCATION: {destination}
PRICE: ${price:.2f} {currency}
DURATION: {duration}
RATING: {rating}/5 ({review_count} reviews)
FREE CANCELLATION: {free_cancellation}
INSTANT CONFIRMATION: {instant_confirmation}
BOOKING URL: {booking_url}
ORIGINAL DESCRIPTION: {description}

=== DECEMBER 2025 SEO REQUIREMENTS ===

Create these sections (1500-1800 words total):

1. **FEATURED SNIPPET HOOK** (First 50 words)
   Start with a direct answer to "What is [Tour Name]?"
   Format: "[Tour Name] is a [duration] ghost tour in [destination] that [unique value proposition]."
   This should be extractable for Google's featured snippet.

2. **ATMOSPHERIC INTRODUCTION** (150-200 words)
   - First-person perspective hints ("visitors report...", "our research shows...")
   - Include the destination's paranormal reputation
   - Mention specific landmarks or locations by name
   - Use sensory language (sights, sounds, feelings)

3. **THE HAUNTED HISTORY OF [LOCATION]** (250-300 words)
   H2 header should include location name for local SEO
   - SPECIFIC historical events with dates when possible
   - Name actual historical figures
   - Primary source references ("according to historical records...")
   - Connect documented history to reported paranormal activity
   - Include at least one lesser-known historical fact

4. **WHAT TO EXPECT ON THIS TOUR** (200-250 words)
   Optimize for "People Also Ask" queries:
   - What happens on the tour?
   - What locations will you visit?
   - What paranormal activity has been reported?
   - Is the tour scary?
   Use a mix of paragraphs and bullet points for scannability.

5. **WHO IS THIS TOUR BEST FOR?** (150-200 words)
   Create a scannable section:
   - Best for: [specific audience types]
   - Great choice if you: [scenarios]
   - Consider alternatives if: [honest limitations]
   Include internal linking suggestion: "See our guide to [destination] ghost tours"

6. **TOUR DETAILS AT A GLANCE**
   Format as a structured list/table for featured snippets:
   - Duration: {duration}
   - Starting Price: ${price:.2f} per person
   - Cancellation Policy: {cancellation_policy}
   - Confirmation: {confirmation_type}
   - Meeting Point: [if mentioned in description]
   - Group Size: [if mentioned]
   - Languages: [if mentioned]

7. **FREQUENTLY ASKED QUESTIONS ABOUT [TOUR NAME]** (6-8 FAQs)
   Structure for FAQ schema - use EXACT question phrasing people search:

   Questions to include:
   - "Is [Tour Name] scary?" (voice search optimization)
   - "Is [Tour Name] suitable for children?"
   - "What should I wear on the [Tour Name]?"
   - "Can I take photos on the ghost tour?"
   - "How much walking is involved?"
   - "What if it rains?" (or weather-related)
   - "Are the ghosts real at [location]?"
   - One question specific to a location on this tour

   Answers should be:
   - 2-3 sentences each
   - Conversational tone (voice search optimized)
   - Include the question keywords in the answer

8. **THE BOTTOM LINE** (100-150 words)
   - Summary verdict with E-E-A-T authority
   - Clear recommendation statement
   - Social proof (rating + review count)
   - End with the BOOK NOW CTA button (use exact block syntax from formatting section)

9. **RELATED EXPERIENCES** (suggest 2-3)
   Internal linking section:
   - "Other ghost tours in [destination]"
   - "Similar experiences you might enjoy"
   (These will be linked by the site)

=== GUTENBERG FORMATTING ===

Use WordPress blocks with EXACT syntax:

For H2 headings (include keywords):
<!-- wp:heading {{"level":2}} --><h2>The Haunted History of {destination}</h2><!-- /wp:heading -->

For H3 (FAQ questions):
<!-- wp:heading {{"level":3}} --><h3>Is This Tour Suitable for Children?</h3><!-- /wp:heading -->

For paragraphs:
<!-- wp:paragraph --><p>Content here.</p><!-- /wp:paragraph -->

For bullet lists:
<!-- wp:list --><ul><li>Item one</li><li>Item two</li></ul><!-- /wp:list -->

For key quotes/testimonials:
<!-- wp:quote --><blockquote class="wp-block-quote"><p>Quote text</p></blockquote><!-- /wp:quote -->

For the details table, use:
<!-- wp:table -->
<figure class="wp-block-table"><table><tbody>
<tr><td><strong>Duration</strong></td><td>{duration}</td></tr>
<tr><td><strong>Price</strong></td><td>From ${price:.2f}</td></tr>
</tbody></table></figure>
<!-- /wp:table -->

For the BOOK NOW CTA button (place at end of "The Bottom Line" section):
<!-- wp:buttons {{"layout":{{"type":"flex","justifyContent":"center"}}}} -->
<div class="wp-block-buttons">
<!-- wp:button {{"backgroundColor":"vivid-red","textColor":"white","style":{{"typography":{{"fontSize":"20px"}}}}}} -->
<div class="wp-block-button has-custom-font-size" style="font-size:20px"><a class="wp-block-button__link has-white-color has-vivid-red-background-color has-text-color has-background wp-element-button" href="{booking_url}">Book This Haunted Tour Now</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->

=== OUTPUT REQUIREMENTS ===

At the very end, provide these SEO elements:

<!-- META: [150-160 character meta description with primary keyword near start] -->

<!-- FOCUS_KEYPHRASE: [primary keyword phrase, e.g., "New Orleans ghost tour"] -->

<!-- SECONDARY_KEYWORDS: [comma-separated related terms] -->

<!-- INTERNAL_LINKS: [suggest 2-3 related pages to link to] -->

=== CRITICAL SEO RULES ===
1. Include the destination name in at least 3 H2 headings
2. Use the tour name naturally 4-6 times throughout
3. Include semantic variations: ghost tour, haunted tour, paranormal tour, spirit walk
4. Write at a 7th-8th grade reading level for accessibility
5. Every section must provide UNIQUE value - no filler paragraphs
6. Include specific names, dates, and locations for credibility
7. Optimize FAQ questions for exact voice search queries
8. First paragraph must be extractable as a featured snippet"""

    DESTINATION_GUIDE_TEMPLATE = """Create a comprehensive, SEO-optimized destination guide for paranormal tourism.
Optimized for December 2025 search algorithms and local SEO.

=== DESTINATION DATA ===
CITY: {destination}
NUMBER OF TOURS AVAILABLE: {tour_count}

FEATURED TOURS:
{tour_list}

=== DECEMBER 2025 SEO REQUIREMENTS ===

Create these sections (1200-1500 words):

1. **FEATURED SNIPPET OPENER** (First 50 words)
   Direct answer: "{destination} is one of America's most haunted cities, offering [X] ghost tours..."
   Must be extractable for Google's featured snippet.

2. **WHY {destination_upper} IS AMERICA'S MOST HAUNTED [REGION]** (200-250 words)
   H2 includes city name for local SEO
   - The city's paranormal reputation with specific claims
   - Historical context (founding date, major events)
   - Famous hauntings with location names
   - What makes this destination unique for ghost hunting

3. **THE DARK HISTORY BEHIND {destination_upper}'S HAUNTINGS** (250-300 words)
   - Specific historical events with DATES
   - Named historical figures
   - Tragedies that contribute to reported hauntings
   - Lesser-known historical facts for uniqueness

4. **BEST GHOST TOURS IN {destination_upper}** (300-400 words)
   Create comparison-style content:
   For each featured tour include:
   - Tour name as H3
   - 2-3 sentence description
   - Best for: [audience type]
   - Price and duration
   - Standout feature

5. **WHEN TO TAKE A GHOST TOUR IN {destination_upper}** (150-200 words)
   Local SEO optimization:
   - Best seasons/months
   - Special events (Halloween, local festivals)
   - Weather considerations
   - Booking tips (advance vs. walk-up)

6. **WHAT TO BRING ON A {destination_upper} GHOST TOUR** (100-150 words)
   Practical list optimized for featured snippets:
   - Essential items
   - Photography equipment
   - Weather preparation
   - What NOT to bring

7. **FREQUENTLY ASKED QUESTIONS ABOUT {destination_upper} GHOST TOURS** (6-8 FAQs)
   Voice search optimized questions:
   - "Are {destination} ghost tours scary?"
   - "Are {destination} ghost tours suitable for kids?"
   - "What is the most haunted place in {destination}?"
   - "How long do ghost tours in {destination} last?"
   - "Do you need reservations for {destination} ghost tours?"
   - Destination-specific questions

8. **PLAN YOUR HAUNTED {destination_upper} ADVENTURE** (100 words)
   CTA section with internal linking suggestions

=== OUTPUT REQUIREMENTS ===
End with:
<!-- META: [150-160 chars, include "{destination} ghost tours"] -->
<!-- FOCUS_KEYPHRASE: {destination} ghost tours -->
<!-- SECONDARY_KEYWORDS: haunted {destination}, {destination} haunted tours, paranormal tours {destination} -->

Format as WordPress Gutenberg blocks with city name in multiple H2 headings."""

    ROUNDUP_TEMPLATE = """Create a unique, SEO-optimized roundup article for December 2025 search algorithms.

=== ARTICLE DATA ===
THEME: {theme}
TOURS TO FEATURE:
{tour_list}

=== DECEMBER 2025 SEO REQUIREMENTS ===

Create these sections (1200-1500 words):

1. **FEATURED SNIPPET OPENER** (First 50 words)
   Direct answer to the theme query. Example:
   "The best ghost tours in America combine historical accuracy, genuine paranormal investigation, and..."
   Must be extractable for position zero.

2. **HOW WE SELECTED THESE TOURS** (100-150 words)
   E-E-A-T credibility section:
   - Selection criteria (ratings, reviews, uniqueness)
   - Our expertise/experience
   - What makes a great ghost tour

3. **INDIVIDUAL TOUR SECTIONS** (200-250 words each)
   For each tour, create a UNIQUE section:

   H2: [Tour Name]: [Compelling descriptor]

   Include:
   - Opening hook specific to THIS tour
   - What makes it exceptional (unique selling points)
   - Specific highlights and locations visited
   - Who this tour is best for
   - Quick facts box:
     * Location: [City]
     * Duration: [Time]
     * Price: From $[X]
     * Rating: [X]/5 ([N] reviews)
   - Honest assessment (pros and potential drawbacks)

4. **COMPARISON: WHICH TOUR IS RIGHT FOR YOU?** (200 words)
   Scannable comparison section:
   - Best for families: [Tour]
   - Best for history buffs: [Tour]
   - Best for serious ghost hunters: [Tour]
   - Best value: [Tour]
   - Most immersive: [Tour]

5. **GHOST TOUR TIPS FROM THE EXPERTS** (150 words)
   E-E-A-T authority section:
   - What to wear
   - Best time to book
   - Photography tips
   - How to get the most from your tour

6. **THE VERDICT** (100 words)
   - Summary recommendation
   - Final CTA with urgency

=== OUTPUT REQUIREMENTS ===
End with:
<!-- META: [150-160 chars with theme keywords] -->
<!-- FOCUS_KEYPHRASE: [primary theme keyword] -->
<!-- SECONDARY_KEYWORDS: [related terms] -->

Format as WordPress Gutenberg blocks.
Each tour section must feel COMPLETELY UNIQUE - vary structure and language.
Each tour section should feel completely unique - no repetitive structures.
End with: <!-- META: Your meta description here -->"""

    def __init__(self):
        self.products = ProductsAPI()
        self.ollama = OllamaClient()
        self.wordpress = WordPressClient()

    def format_duration(self, minutes: int) -> str:
        """Format duration in minutes to human readable"""
        if not minutes:
            return "Duration varies"
        hours = minutes // 60
        mins = minutes % 60
        if hours == 0:
            return f"{mins} minutes"
        if mins == 0:
            return f"{hours} hour{'s' if hours > 1 else ''}"
        return f"{hours} hour{'s' if hours > 1 else ''} {mins} minutes"

    def generate_schema_markup(self, product: Dict) -> str:
        """Generate comprehensive JSON-LD schema markup (December 2025 best practices)"""
        from datetime import datetime

        destination = product.get("destinationName", "")
        duration_mins = product.get("durationMinutes", 0)
        duration_iso = f"PT{duration_mins}M" if duration_mins else "PT2H"

        # Combined schema with multiple types for rich results
        schema = {
            "@context": "https://schema.org",
            "@graph": [
                # Product schema for shopping results
                {
                    "@type": "Product",
                    "@id": f"#product-{product.get('productCode')}",
                    "name": product.get("title"),
                    "description": product.get("description", "")[:300],
                    "image": product.get("primaryImageUrl"),
                    "brand": {
                        "@type": "Brand",
                        "name": "Viator"
                    },
                    "offers": {
                        "@type": "Offer",
                        "price": product.get("priceFrom"),
                        "priceCurrency": product.get("currencyCode", "USD"),
                        "availability": "https://schema.org/InStock",
                        "url": product.get("webUrl"),
                        "validFrom": datetime.now().strftime("%Y-%m-%d"),
                        "priceValidUntil": f"{datetime.now().year + 1}-12-31"
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": product.get("rating", 4.5),
                        "reviewCount": product.get("reviewCount", 0),
                        "bestRating": 5,
                        "worstRating": 1
                    } if product.get("rating") else None
                },
                # TouristTrip schema for travel results
                {
                    "@type": "TouristTrip",
                    "@id": f"#trip-{product.get('productCode')}",
                    "name": product.get("title"),
                    "description": product.get("description", "")[:300],
                    "image": product.get("primaryImageUrl"),
                    "touristType": ["Ghost Tour Enthusiasts", "History Buffs", "Paranormal Investigators"],
                    "itinerary": {
                        "@type": "ItemList",
                        "name": f"Ghost Tour in {destination}",
                        "description": f"Explore haunted locations in {destination}"
                    },
                    "offers": {
                        "@type": "Offer",
                        "price": product.get("priceFrom"),
                        "priceCurrency": product.get("currencyCode", "USD"),
                        "url": product.get("webUrl")
                    }
                },
                # TouristAttraction for local SEO
                {
                    "@type": "TouristAttraction",
                    "name": f"Ghost Tours in {destination}",
                    "description": f"Haunted walking tours and paranormal experiences in {destination}",
                    "touristType": ["Ghost Hunters", "History Enthusiasts", "Thrill Seekers"],
                    "isAccessibleForFree": False,
                    "publicAccess": True
                },
                # Event schema for tour bookings
                {
                    "@type": "Event",
                    "@id": f"#event-{product.get('productCode')}",
                    "name": product.get("title"),
                    "description": product.get("description", "")[:200],
                    "image": product.get("primaryImageUrl"),
                    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                    "eventStatus": "https://schema.org/EventScheduled",
                    "location": {
                        "@type": "Place",
                        "name": destination,
                        "address": {
                            "@type": "PostalAddress",
                            "addressLocality": destination,
                            "addressCountry": "US"
                        }
                    },
                    "organizer": {
                        "@type": "Organization",
                        "name": "Viator",
                        "url": "https://www.viator.com"
                    },
                    "offers": {
                        "@type": "Offer",
                        "price": product.get("priceFrom"),
                        "priceCurrency": product.get("currencyCode", "USD"),
                        "url": product.get("webUrl"),
                        "availability": "https://schema.org/InStock"
                    },
                    "performer": {
                        "@type": "PerformingGroup",
                        "name": "Professional Tour Guide"
                    },
                    "duration": duration_iso
                },
                # BreadcrumbList for navigation
                {
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Home",
                            "item": SITE_URL
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Ghost Tours",
                            "item": f"{SITE_URL}/ghost-tours/"
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": destination,
                            "item": f"{SITE_URL}/destinations/{destination.lower().replace(' ', '-')}/"
                        },
                        {
                            "@type": "ListItem",
                            "position": 4,
                            "name": product.get("title")
                        }
                    ]
                }
            ]
        }

        # Remove None values from aggregateRating if not present
        schema["@graph"] = [item for item in schema["@graph"] if item]
        for item in schema["@graph"]:
            if isinstance(item, dict):
                if item.get("aggregateRating") is None:
                    item.pop("aggregateRating", None)

        return json.dumps(schema, indent=2)

    def generate_faq_schema(self, faqs: List[Dict]) -> str:
        """Generate FAQ schema markup for rich results"""
        schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": faq["question"],
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq["answer"]
                    }
                }
                for faq in faqs
            ]
        }
        return json.dumps(schema, indent=2)

    def check_status(self) -> Dict:
        """Check status of all services"""
        ollama_ok = self.ollama.is_available()
        models = self.ollama.list_models() if ollama_ok else []

        return {
            "ollama": {
                "available": ollama_ok,
                "url": OLLAMA_URL,
                "model": OLLAMA_MODEL,
                "models_available": models
            },
            "products_api": {"url": PRODUCTS_API_URL},
            "wordpress": {"url": WORDPRESS_URL, "username": WP_USERNAME}
        }

    def generate_tour_article(self, product_code: str = None, product_id: str = None,
                               publish: bool = False) -> Dict:
        """Generate a comprehensive article for a single tour product"""
        # Fetch product
        if product_code:
            product = self.products.get_product_by_code(product_code)
        elif product_id:
            product = self.products.get_product_by_id(product_id)
        else:
            raise ValueError("Either product_code or product_id is required")

        # Determine cancellation and confirmation text
        free_cancel = "Yes - Free cancellation available" if product.get("freeCancellation") else "Check tour details"
        instant_confirm = "Instant" if product.get("confirmationType") == "INSTANT" else "Manual review required"

        # Build comprehensive prompt
        prompt = self.PRODUCT_SPLASH_TEMPLATE.format(
            title=product.get("title", "Unknown Tour"),
            destination=product.get("destinationName", "Unknown"),
            price=product.get("priceFrom", 0) or 0,
            currency=product.get("currencyCode", "USD"),
            duration=self.format_duration(product.get("durationMinutes")),
            rating=product.get("rating") or "N/A",
            review_count=product.get("reviewCount", 0),
            free_cancellation=free_cancel,
            instant_confirmation=instant_confirm,
            booking_url=product.get("webUrl", ""),
            description=product.get("description", "")[:2000],
            cancellation_policy=free_cancel,
            confirmation_type=instant_confirm
        )

        # Generate content with Ollama
        print(f"Generating comprehensive article for: {product.get('title')}")
        print("This may take a minute...")
        content = self.ollama.generate(prompt, system=self.SYSTEM_PROMPT, max_tokens=4000)

        if not content:
            raise Exception("Failed to generate content")

        # Extract meta description if present
        meta_desc = ""
        if "<!-- META:" in content:
            try:
                meta_start = content.index("<!-- META:") + 10
                meta_end = content.index("-->", meta_start)
                meta_desc = content[meta_start:meta_end].strip()
                # Remove meta comment from content
                content = content[:content.index("<!-- META:")].strip()
            except:
                pass

        # Generate schema markup
        product_schema = self.generate_schema_markup(product)

        # Add schema to content
        schema_block = f'''<!-- wp:html -->
<script type="application/ld+json">
{product_schema}
</script>
<!-- /wp:html -->'''

        full_content = schema_block + "\n\n" + content

        # Upload featured image
        featured_media = None
        if product.get("primaryImageUrl"):
            print("Uploading featured image...")
            featured_media = self.wordpress.upload_image(
                product.get("primaryImageUrl"),
                product.get("title", "tour")
            )

        # Create WordPress post
        print(f"Creating WordPress post ({'publish' if publish else 'draft'})...")
        post = self.wordpress.create_post(
            title=product.get("title"),
            content=full_content,
            status="publish" if publish else "draft",
            featured_media=featured_media,
            excerpt=meta_desc,
            meta={
                "product_code": product.get("productCode"),
                "booking_url": product.get("webUrl"),
                "tour_price": str(product.get("priceFrom", "")),
                "tour_rating": str(product.get("rating", "")),
                "tour_destination": product.get("destinationName", ""),
            }
        )

        return {
            "success": True,
            "post": {
                "id": post.get("id"),
                "title": post.get("title", {}).get("rendered"),
                "link": post.get("link"),
                "status": post.get("status"),
                "excerpt": meta_desc
            },
            "product": {
                "code": product.get("productCode"),
                "title": product.get("title"),
                "destination": product.get("destinationName"),
                "rating": product.get("rating"),
                "price": product.get("priceFrom")
            },
            "content_length": len(content)
        }

    def generate_destination_guide(self, destination: str, niche: str = "haunted",
                                    max_tours: int = 5, publish: bool = False) -> Dict:
        """Generate a destination guide article"""
        tours = self.products.search_by_destination(destination, niche=niche, limit=max_tours)

        if not tours:
            raise ValueError(f"No tours found for destination: {destination}")

        tour_list = "\n\n".join([
            f"{i+1}. {t.get('title')}\n"
            f"   Rating: {t.get('rating', 'N/A')}/5 ({t.get('reviewCount', 0)} reviews)\n"
            f"   Price: ${t.get('priceFrom', 0):.2f}\n"
            f"   Duration: {self.format_duration(t.get('durationMinutes'))}\n"
            f"   Highlights: {(t.get('description') or '')[:300]}..."
            for i, t in enumerate(tours)
        ])

        prompt = self.DESTINATION_GUIDE_TEMPLATE.format(
            destination=destination,
            destination_upper=destination.upper(),
            tour_count=len(tours),
            tour_list=tour_list
        )

        print(f"Generating destination guide for: {destination}")
        content = self.ollama.generate(prompt, system=self.SYSTEM_PROMPT, max_tokens=3500)

        if not content:
            raise Exception("Failed to generate content")

        # Extract meta
        meta_desc = ""
        if "<!-- META:" in content:
            try:
                meta_start = content.index("<!-- META:") + 10
                meta_end = content.index("-->", meta_start)
                meta_desc = content[meta_start:meta_end].strip()
                content = content[:content.index("<!-- META:")].strip()
            except:
                pass

        featured_media = None
        if tours[0].get("primaryImageUrl"):
            print("Uploading featured image...")
            featured_media = self.wordpress.upload_image(
                tours[0].get("primaryImageUrl"),
                f"haunted-{destination}"
            )

        title = f"Haunted {destination}: Complete Guide to Ghost Tours & Paranormal Experiences"
        print(f"Creating WordPress post ({'publish' if publish else 'draft'})...")
        post = self.wordpress.create_post(
            title=title,
            content=content,
            status="publish" if publish else "draft",
            featured_media=featured_media,
            excerpt=meta_desc
        )

        return {
            "success": True,
            "post": {
                "id": post.get("id"),
                "title": post.get("title", {}).get("rendered"),
                "link": post.get("link"),
                "status": post.get("status")
            },
            "destination": destination,
            "tours_included": [{"title": t.get("title"), "rating": t.get("rating")} for t in tours]
        }

    def generate_roundup(self, theme: str, niche: str = "haunted",
                         count: int = 5, min_rating: float = 4.5,
                         destination: str = None, publish: bool = False) -> Dict:
        """Generate a roundup/listicle article"""
        tours = self.products.get_top_rated(niche=niche, min_rating=min_rating, limit=count * 2)

        if destination:
            tours = [t for t in tours if destination.lower() in (t.get("destinationName") or "").lower()]

        tours = tours[:count]

        if not tours:
            raise ValueError("No tours match the criteria")

        tour_list = "\n\n".join([
            f"{i+1}. {t.get('title')} ({t.get('destinationName')})\n"
            f"   Rating: {t.get('rating', 'N/A')}/5 ({t.get('reviewCount', 0)} reviews)\n"
            f"   Price: ${t.get('priceFrom', 0):.2f}\n"
            f"   Duration: {self.format_duration(t.get('durationMinutes'))}\n"
            f"   Description: {(t.get('description') or '')[:400]}..."
            for i, t in enumerate(tours)
        ])

        prompt = self.ROUNDUP_TEMPLATE.format(
            theme=theme,
            tour_list=tour_list
        )

        print(f"Generating roundup: {theme}")
        content = self.ollama.generate(prompt, system=self.SYSTEM_PROMPT, max_tokens=3500)

        if not content:
            raise Exception("Failed to generate content")

        # Extract meta
        meta_desc = ""
        if "<!-- META:" in content:
            try:
                meta_start = content.index("<!-- META:") + 10
                meta_end = content.index("-->", meta_start)
                meta_desc = content[meta_start:meta_end].strip()
                content = content[:content.index("<!-- META:")].strip()
            except:
                pass

        featured_media = None
        if tours[0].get("primaryImageUrl"):
            print("Uploading featured image...")
            featured_media = self.wordpress.upload_image(
                tours[0].get("primaryImageUrl"),
                theme
            )

        print(f"Creating WordPress post ({'publish' if publish else 'draft'})...")
        post = self.wordpress.create_post(
            title=theme,
            content=content,
            status="publish" if publish else "draft",
            featured_media=featured_media,
            excerpt=meta_desc
        )

        return {
            "success": True,
            "post": {
                "id": post.get("id"),
                "title": post.get("title", {}).get("rendered"),
                "link": post.get("link"),
                "status": post.get("status")
            },
            "theme": theme,
            "tours_included": [
                {"title": t.get("title"), "destination": t.get("destinationName"), "rating": t.get("rating")}
                for t in tours
            ]
        }

    def preview_article(self, product_code: str) -> Dict:
        """Preview generated content without publishing"""
        product = self.products.get_product_by_code(product_code)

        free_cancel = "Yes - Free cancellation" if product.get("freeCancellation") else "Check details"
        instant_confirm = "Instant" if product.get("confirmationType") == "INSTANT" else "Manual"

        prompt = self.PRODUCT_SPLASH_TEMPLATE.format(
            title=product.get("title", "Unknown Tour"),
            destination=product.get("destinationName", "Unknown"),
            price=product.get("priceFrom", 0) or 0,
            currency=product.get("currencyCode", "USD"),
            duration=self.format_duration(product.get("durationMinutes")),
            rating=product.get("rating") or "N/A",
            review_count=product.get("reviewCount", 0),
            free_cancellation=free_cancel,
            instant_confirmation=instant_confirm,
            booking_url=product.get("webUrl", ""),
            description=product.get("description", "")[:2000],
            cancellation_policy=free_cancel,
            confirmation_type=instant_confirm
        )

        print(f"Generating preview for: {product.get('title')}")
        content = self.ollama.generate(prompt, system=self.SYSTEM_PROMPT, max_tokens=4000)

        return {
            "preview": True,
            "product": {
                "code": product.get("productCode"),
                "title": product.get("title"),
                "destination": product.get("destinationName"),
                "image": product.get("primaryImageUrl"),
                "rating": product.get("rating"),
                "price": product.get("priceFrom")
            },
            "generated_content": content,
            "word_count": len(content.split())
        }


def main():
    """CLI interface for the article generator"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Cursed Tours AI Article Generator - Creates unique, SEO-optimized content"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    subparsers.add_parser("status", help="Check service status (Ollama, WordPress, API)")

    # Tour article command
    tour_parser = subparsers.add_parser("tour", help="Generate comprehensive tour article with FAQs")
    tour_parser.add_argument("--code", help="Viator product code")
    tour_parser.add_argument("--id", help="Database product ID")
    tour_parser.add_argument("--publish", action="store_true", help="Publish immediately (default: draft)")

    # Destination guide command
    dest_parser = subparsers.add_parser("destination", help="Generate destination guide")
    dest_parser.add_argument("name", help="Destination name (e.g., 'New Orleans')")
    dest_parser.add_argument("--niche", default="haunted", help="Tour niche (default: haunted)")
    dest_parser.add_argument("--max-tours", type=int, default=5, help="Max tours to include")
    dest_parser.add_argument("--publish", action="store_true", help="Publish immediately")

    # Roundup command
    roundup_parser = subparsers.add_parser("roundup", help="Generate roundup/listicle article")
    roundup_parser.add_argument("theme", help="Article theme (e.g., 'Top 10 Ghost Tours in America')")
    roundup_parser.add_argument("--niche", default="haunted", help="Tour niche")
    roundup_parser.add_argument("--count", type=int, default=5, help="Number of tours to feature")
    roundup_parser.add_argument("--min-rating", type=float, default=4.5, help="Minimum rating filter")
    roundup_parser.add_argument("--destination", help="Filter by destination")
    roundup_parser.add_argument("--publish", action="store_true", help="Publish immediately")

    # Preview command
    preview_parser = subparsers.add_parser("preview", help="Preview article without publishing")
    preview_parser.add_argument("code", help="Viator product code")

    # List products command
    list_parser = subparsers.add_parser("list", help="List available products")
    list_parser.add_argument("--niche", default="haunted", help="Tour niche")
    list_parser.add_argument("--limit", type=int, default=10, help="Number of products to show")
    list_parser.add_argument("--destination", help="Filter by destination")
    list_parser.add_argument("--min-rating", type=float, default=0, help="Minimum rating filter")

    args = parser.parse_args()

    generator = ArticleGenerator()

    try:
        if args.command == "status":
            status = generator.check_status()
            print(json.dumps(status, indent=2))

        elif args.command == "tour":
            if not args.code and not args.id:
                print("Error: Either --code or --id is required")
                return
            result = generator.generate_tour_article(
                product_code=args.code,
                product_id=args.id,
                publish=args.publish
            )
            print("\n" + "="*50)
            print("ARTICLE GENERATED SUCCESSFULLY")
            print("="*50)
            print(json.dumps(result, indent=2))

        elif args.command == "destination":
            result = generator.generate_destination_guide(
                destination=args.name,
                niche=args.niche,
                max_tours=args.max_tours,
                publish=args.publish
            )
            print("\n" + "="*50)
            print("DESTINATION GUIDE GENERATED")
            print("="*50)
            print(json.dumps(result, indent=2))

        elif args.command == "roundup":
            result = generator.generate_roundup(
                theme=args.theme,
                niche=args.niche,
                count=args.count,
                min_rating=args.min_rating,
                destination=args.destination,
                publish=args.publish
            )
            print("\n" + "="*50)
            print("ROUNDUP ARTICLE GENERATED")
            print("="*50)
            print(json.dumps(result, indent=2))

        elif args.command == "preview":
            result = generator.preview_article(args.code)
            print("\n" + "="*50)
            print(f"PREVIEW: {result['product']['title']}")
            print(f"Word count: {result['word_count']}")
            print("="*50 + "\n")
            print(result['generated_content'])

        elif args.command == "list":
            if args.destination:
                products = generator.products.search_by_destination(
                    args.destination, niche=args.niche, limit=args.limit
                )
            else:
                data = generator.products.get_products(niche=args.niche, limit=args.limit)
                products = data.get("products", [])

            # Filter by rating
            if args.min_rating > 0:
                products = [p for p in products if (p.get("rating") or 0) >= args.min_rating]

            print(f"\nFound {len(products)} tours:\n")
            for p in products:
                rating = p.get('rating', 'N/A')
                rating_str = f"{rating}/5" if rating != 'N/A' else 'N/A'
                print(f"[{p.get('productCode')}] {p.get('title')}")
                print(f"    {p.get('destinationName')} | ${p.get('priceFrom', 0):.2f} | {rating_str} ({p.get('reviewCount', 0)} reviews)")
                print()

        else:
            parser.print_help()

    except Exception as e:
        print(f"\nError: {e}")
        raise


if __name__ == "__main__":
    main()
