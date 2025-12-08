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
    """Main article generator with rich, unique content"""

    SYSTEM_PROMPT = """You are a senior content writer for Cursed Tours, a paranormal tourism website.
Your writing is atmospheric, historically accurate, and deeply engaging.
You create UNIQUE content for each tour - never use generic templates or filler text.
Research and incorporate specific historical facts, local legends, and paranormal reports.
Do not use emojis. Write in a tone that is intriguing but credible.
Format all output as WordPress Gutenberg blocks."""

    # Comprehensive tour article with FAQs and editorial content
    PRODUCT_SPLASH_TEMPLATE = """Create a comprehensive, UNIQUE product page for this haunted tour.
DO NOT use generic filler - every sentence should be specific to THIS tour.

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

=== CONTENT REQUIREMENTS ===

Create the following sections (1200-1500 words total):

1. **ATMOSPHERIC INTRODUCTION** (150-200 words)
   - Set the scene with vivid, location-specific imagery
   - Hook the reader with an intriguing aspect of this specific tour
   - Mention the destination's paranormal reputation

2. **THE HAUNTED HISTORY** (200-250 words)
   - Research and include SPECIFIC historical events related to this tour's locations
   - Name actual historical figures, dates, or events if known
   - Connect history to reported hauntings

3. **WHAT YOU'LL EXPERIENCE** (200-250 words)
   - Describe the tour journey in detail
   - Mention specific stops or highlights unique to this tour
   - What paranormal activity has been reported?

4. **WHY WE RECOMMEND THIS TOUR** (150-200 words)
   - Editorial perspective on what makes this tour stand out
   - Who is this tour best suited for?
   - How does it compare to other options in {destination}?

5. **TOUR DETAILS** (format as a clean list)
   - Duration: {duration}
   - Price: From ${price:.2f}
   - Cancellation: {cancellation_policy}
   - Confirmation: {confirmation_type}

6. **FREQUENTLY ASKED QUESTIONS** (5-6 unique FAQs)
   Generate questions SPECIFIC to this tour, such as:
   - Is [Tour Name] suitable for children?
   - What paranormal activity has been reported at [specific location on tour]?
   - How much walking is involved?
   - What should I bring on the tour?
   - Can I take photographs during the tour?
   - Is the tour accessible for those with mobility issues?

   Answer each FAQ thoroughly (2-3 sentences each).

7. **BOOK YOUR EXPERIENCE** (call to action)
   - Compelling reason to book now
   - Mention the rating and reviews as social proof

=== FORMATTING ===
Use WordPress Gutenberg blocks:
- <!-- wp:heading {{"level":2}} --><h2>Section Title</h2><!-- /wp:heading -->
- <!-- wp:paragraph --><p>Content</p><!-- /wp:paragraph -->
- <!-- wp:list --><ul><li>Item</li></ul><!-- /wp:list -->
- <!-- wp:quote --><blockquote class="wp-block-quote"><p>Quote</p></blockquote><!-- /wp:quote -->

For FAQs, use this exact structure for schema markup:
<!-- wp:heading {{"level":2}} --><h2>Frequently Asked Questions</h2><!-- /wp:heading -->
<!-- wp:heading {{"level":3}} --><h3>Question here?</h3><!-- /wp:heading -->
<!-- wp:paragraph --><p>Answer here.</p><!-- /wp:paragraph -->

=== META DESCRIPTION ===
End with a meta description (150-160 characters) in this format:
<!-- META: Your meta description here -->

=== IMPORTANT ===
- Every piece of content must be UNIQUE to this specific tour
- Do not use generic phrases like "this amazing tour" or "unforgettable experience"
- Include specific details from the tour description
- Write as if you've researched this tour and location thoroughly"""

    DESTINATION_GUIDE_TEMPLATE = """Create a comprehensive destination guide for paranormal tourism.

=== DESTINATION DATA ===
CITY: {destination}
NUMBER OF TOURS AVAILABLE: {tour_count}

FEATURED TOURS:
{tour_list}

=== CONTENT REQUIREMENTS ===

Create these sections (1000-1200 words):

1. **INTRODUCTION TO HAUNTED {destination_upper}** (200-250 words)
   - The city's paranormal reputation and history
   - Why ghost hunters and paranormal enthusiasts visit here
   - Famous hauntings or supernatural events

2. **THE DARK HISTORY** (200-250 words)
   - Historical events that contribute to hauntings (wars, epidemics, tragedies)
   - Famous historical figures connected to local hauntings
   - Specific locations known for paranormal activity

3. **GHOST TOUR OPTIONS** (300-400 words)
   - Overview of available tour types
   - Brief highlight of each featured tour
   - What makes each one different

4. **BEST TIME TO VISIT** (100-150 words)
   - Seasonal considerations
   - Special events (Halloween, anniversaries of historical events)
   - Weather and crowd considerations

5. **TIPS FOR PARANORMAL ENTHUSIASTS** (150-200 words)
   - What to bring
   - How to prepare
   - Etiquette on ghost tours
   - Photography tips

6. **FAQs ABOUT GHOST TOURS IN {destination_upper}** (4-5 questions)
   - Specific to this destination
   - Practical questions visitors might have

Format as WordPress Gutenberg blocks.
End with: <!-- META: Your meta description here -->"""

    ROUNDUP_TEMPLATE = """Create a unique roundup article featuring top haunted tours.

=== ARTICLE DATA ===
THEME: {theme}
TOURS TO FEATURE:
{tour_list}

=== CONTENT REQUIREMENTS ===

1. **INTRODUCTION** (150-200 words)
   - Why this roundup matters
   - What criteria were used for selection
   - What readers will discover

2. **INDIVIDUAL TOUR SECTIONS** (150-200 words each)
   For each tour, create a unique section with:
   - H2 heading with tour name
   - What makes this tour exceptional
   - Specific highlights and unique features
   - Rating, price, and duration info
   - Who this tour is best for

3. **HOW TO CHOOSE** (100-150 words)
   - Recommendations for different types of visitors
   - Budget vs premium options
   - Family-friendly vs adults-only

4. **CONCLUSION** (100 words)
   - Summary of the best options
   - Encouragement to book

Format as WordPress Gutenberg blocks.
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
        """Generate JSON-LD schema markup for the product"""
        schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.get("title"),
            "description": product.get("description", "")[:200],
            "image": product.get("primaryImageUrl"),
            "offers": {
                "@type": "Offer",
                "price": product.get("priceFrom"),
                "priceCurrency": product.get("currencyCode", "USD"),
                "availability": "https://schema.org/InStock",
                "url": product.get("viatorUrl")
            }
        }

        if product.get("rating"):
            schema["aggregateRating"] = {
                "@type": "AggregateRating",
                "ratingValue": product.get("rating"),
                "reviewCount": product.get("reviewCount", 0),
                "bestRating": 5,
                "worstRating": 1
            }

        return json.dumps(schema, indent=2)

    def generate_faq_schema(self, faqs: List[Dict]) -> str:
        """Generate FAQ schema markup"""
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
            booking_url=product.get("viatorUrl", ""),
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
                "viator_url": product.get("viatorUrl"),
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
            booking_url=product.get("viatorUrl", ""),
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
