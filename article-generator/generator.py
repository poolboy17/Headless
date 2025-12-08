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


@dataclass
class Product:
    """Tour product data"""
    id: str
    product_code: str
    title: str
    description: str
    price: float
    currency: str
    destination: str
    rating: float
    review_count: int
    duration_minutes: int
    image_url: str
    booking_url: str
    free_cancellation: bool


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

    def generate(self, prompt: str, system: str = None) -> str:
        """Generate text using Ollama"""
        url = f"{self.base_url}/api/generate"

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 2000,
            }
        }

        if system:
            payload["system"] = system

        response = requests.post(url, json=payload, timeout=120)
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
                    tags: List[int] = None, meta: Dict = None) -> Dict:
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

        response = requests.post(url, json=payload, headers=self._headers())
        response.raise_for_status()
        return response.json()

    def upload_image(self, image_url: str, title: str) -> Optional[int]:
        """Upload an image from URL to WordPress media library"""
        try:
            # Download the image
            img_response = requests.get(image_url, timeout=30)
            img_response.raise_for_status()

            content_type = img_response.headers.get("content-type", "image/jpeg")
            ext = "png" if "png" in content_type else "jpg"
            filename = f"{title.lower().replace(' ', '-')[:50]}.{ext}"

            # Upload to WordPress
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

    def get_categories(self) -> List[Dict]:
        """Get all categories"""
        url = f"{self.api_url}/categories"
        response = requests.get(url, params={"per_page": 100})
        return response.json()

    def get_tags(self) -> List[Dict]:
        """Get all tags"""
        url = f"{self.api_url}/tags"
        response = requests.get(url, params={"per_page": 100})
        return response.json()


class ArticleGenerator:
    """Main article generator that combines all components"""

    SYSTEM_PROMPT = """You are a writer for Cursed Tours, a paranormal investigation and ghost tour blog.
Your tone is intriguing, atmospheric, and respectful of the supernatural.
Write engaging, SEO-friendly content that captures the mystery and history of haunted locations.
Do not use emojis. Format output as WordPress Gutenberg blocks."""

    SHOWCASE_TEMPLATE = """Create a comprehensive showcase article for this haunted tour:

TOUR: {title}
LOCATION: {destination}
PRICE: ${price:.2f} {currency}
DURATION: {duration}
RATING: {rating}/5 ({review_count} reviews)
DESCRIPTION: {description}

Write an engaging article (600-800 words) that includes:
1. An atmospheric introduction that sets the scene
2. What makes this tour unique and compelling
3. Historical and paranormal significance of the locations
4. What visitors can expect during the experience
5. Practical details (duration, what's included)
6. A compelling call to action

Format everything as WordPress Gutenberg blocks:
- Use <!-- wp:heading {"level":2} --> for h2 headings
- Use <!-- wp:paragraph --> for paragraphs
- Use <!-- wp:list --> for bullet points
- Use <!-- wp:quote --> for atmospheric quotes

End with a suggested meta description (150-160 chars) in a HTML comment."""

    DESTINATION_TEMPLATE = """Create a destination guide for haunted tours in this city:

DESTINATION: {destination}
NUMBER OF TOURS: {tour_count}

FEATURED TOURS:
{tour_list}

Write an engaging destination guide (800-1000 words) that includes:
1. Introduction to the city's haunted history and paranormal reputation
2. Why this destination is perfect for ghost tour enthusiasts
3. Overview of the different tour experiences available
4. Best times to visit and what to expect
5. Tips for paranormal enthusiasts
6. Compelling conclusion encouraging booking

Format as WordPress Gutenberg blocks. Include suggested meta description at the end."""

    ROUNDUP_TEMPLATE = """Create a roundup article featuring these top-rated haunted tours:

THEME: {theme}

TOURS TO FEATURE:
{tour_list}

Write an engaging roundup article (700-900 words) that includes:
1. Introduction explaining why these tours stand out
2. Individual sections for each tour with:
   - Tour name and location as h2 heading
   - What makes it special
   - Key highlights
   - Rating and price info
3. Conclusion with recommendations for different types of visitors

Format as WordPress Gutenberg blocks with h2 for each tour section.
Include suggested meta description at the end."""

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
            "products_api": {
                "url": PRODUCTS_API_URL
            },
            "wordpress": {
                "url": WORDPRESS_URL,
                "username": WP_USERNAME
            }
        }

    def generate_tour_article(self, product_code: str = None, product_id: str = None,
                               publish: bool = False) -> Dict:
        """Generate an article for a single tour product"""
        # Fetch product
        if product_code:
            product = self.products.get_product_by_code(product_code)
        elif product_id:
            product = self.products.get_product_by_id(product_id)
        else:
            raise ValueError("Either product_code or product_id is required")

        # Build prompt
        prompt = self.SHOWCASE_TEMPLATE.format(
            title=product.get("title", "Unknown Tour"),
            destination=product.get("destinationName", "Unknown"),
            price=product.get("priceFrom", 0),
            currency=product.get("currencyCode", "USD"),
            duration=self.format_duration(product.get("durationMinutes")),
            rating=product.get("rating", "N/A"),
            review_count=product.get("reviewCount", 0),
            description=product.get("description", "")[:1500]
        )

        # Generate content with Ollama
        print(f"Generating article for: {product.get('title')}")
        content = self.ollama.generate(prompt, system=self.SYSTEM_PROMPT)

        if not content:
            raise Exception("Failed to generate content")

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
            content=content,
            status="publish" if publish else "draft",
            featured_media=featured_media,
            meta={
                "product_code": product.get("productCode"),
                "viator_url": product.get("viatorUrl"),
                "tour_price": str(product.get("priceFrom", "")),
            }
        )

        return {
            "success": True,
            "post": {
                "id": post.get("id"),
                "title": post.get("title", {}).get("rendered"),
                "link": post.get("link"),
                "status": post.get("status")
            },
            "product": {
                "code": product.get("productCode"),
                "title": product.get("title"),
                "destination": product.get("destinationName")
            }
        }

    def generate_destination_guide(self, destination: str, niche: str = "haunted",
                                    max_tours: int = 5, publish: bool = False) -> Dict:
        """Generate a destination guide article"""
        # Fetch tours for destination
        tours = self.products.search_by_destination(destination, niche=niche, limit=max_tours)

        if not tours:
            raise ValueError(f"No tours found for destination: {destination}")

        # Build tour list for prompt
        tour_list = "\n\n".join([
            f"{i+1}. {t.get('title')}\n"
            f"   Rating: {t.get('rating', 'N/A')}/5 ({t.get('reviewCount', 0)} reviews)\n"
            f"   Price: ${t.get('priceFrom', 0):.2f}\n"
            f"   Duration: {self.format_duration(t.get('durationMinutes'))}\n"
            f"   {(t.get('description') or '')[:200]}..."
            for i, t in enumerate(tours)
        ])

        prompt = self.DESTINATION_TEMPLATE.format(
            destination=destination,
            tour_count=len(tours),
            tour_list=tour_list
        )

        # Generate content
        print(f"Generating destination guide for: {destination}")
        content = self.ollama.generate(prompt, system=self.SYSTEM_PROMPT)

        if not content:
            raise Exception("Failed to generate content")

        # Upload featured image from first tour
        featured_media = None
        if tours[0].get("primaryImageUrl"):
            print("Uploading featured image...")
            featured_media = self.wordpress.upload_image(
                tours[0].get("primaryImageUrl"),
                f"haunted-{destination}"
            )

        # Create post
        title = f"Haunted {destination}: Your Guide to Ghost Tours & Paranormal Experiences"
        print(f"Creating WordPress post ({'publish' if publish else 'draft'})...")
        post = self.wordpress.create_post(
            title=title,
            content=content,
            status="publish" if publish else "draft",
            featured_media=featured_media
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
        # Fetch top-rated tours
        tours = self.products.get_top_rated(niche=niche, min_rating=min_rating, limit=count * 2)

        # Filter by destination if specified
        if destination:
            tours = [t for t in tours if destination.lower() in (t.get("destinationName") or "").lower()]

        tours = tours[:count]

        if not tours:
            raise ValueError("No tours match the criteria")

        # Build tour list
        tour_list = "\n\n".join([
            f"{i+1}. {t.get('title')} ({t.get('destinationName')})\n"
            f"   Rating: {t.get('rating', 'N/A')}/5 ({t.get('reviewCount', 0)} reviews)\n"
            f"   Price: ${t.get('priceFrom', 0):.2f}\n"
            f"   Duration: {self.format_duration(t.get('durationMinutes'))}\n"
            f"   {(t.get('description') or '')[:300]}..."
            for i, t in enumerate(tours)
        ])

        prompt = self.ROUNDUP_TEMPLATE.format(
            theme=theme,
            tour_list=tour_list
        )

        # Generate content
        print(f"Generating roundup: {theme}")
        content = self.ollama.generate(prompt, system=self.SYSTEM_PROMPT)

        if not content:
            raise Exception("Failed to generate content")

        # Upload featured image
        featured_media = None
        if tours[0].get("primaryImageUrl"):
            print("Uploading featured image...")
            featured_media = self.wordpress.upload_image(
                tours[0].get("primaryImageUrl"),
                theme
            )

        # Create post
        print(f"Creating WordPress post ({'publish' if publish else 'draft'})...")
        post = self.wordpress.create_post(
            title=theme,
            content=content,
            status="publish" if publish else "draft",
            featured_media=featured_media
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

        prompt = self.SHOWCASE_TEMPLATE.format(
            title=product.get("title", "Unknown Tour"),
            destination=product.get("destinationName", "Unknown"),
            price=product.get("priceFrom", 0),
            currency=product.get("currencyCode", "USD"),
            duration=self.format_duration(product.get("durationMinutes")),
            rating=product.get("rating", "N/A"),
            review_count=product.get("reviewCount", 0),
            description=product.get("description", "")[:1500]
        )

        print(f"Generating preview for: {product.get('title')}")
        content = self.ollama.generate(prompt, system=self.SYSTEM_PROMPT)

        return {
            "preview": True,
            "product": {
                "code": product.get("productCode"),
                "title": product.get("title"),
                "destination": product.get("destinationName"),
                "image": product.get("primaryImageUrl")
            },
            "generated_content": content
        }


def main():
    """CLI interface for the article generator"""
    import argparse

    parser = argparse.ArgumentParser(description="Cursed Tours AI Article Generator")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    subparsers.add_parser("status", help="Check service status")

    # Tour article command
    tour_parser = subparsers.add_parser("tour", help="Generate tour showcase article")
    tour_parser.add_argument("--code", help="Viator product code")
    tour_parser.add_argument("--id", help="Database product ID")
    tour_parser.add_argument("--publish", action="store_true", help="Publish immediately")

    # Destination guide command
    dest_parser = subparsers.add_parser("destination", help="Generate destination guide")
    dest_parser.add_argument("name", help="Destination name (e.g., 'New Orleans')")
    dest_parser.add_argument("--niche", default="haunted", help="Tour niche")
    dest_parser.add_argument("--max-tours", type=int, default=5, help="Max tours to include")
    dest_parser.add_argument("--publish", action="store_true", help="Publish immediately")

    # Roundup command
    roundup_parser = subparsers.add_parser("roundup", help="Generate roundup article")
    roundup_parser.add_argument("theme", help="Article theme (e.g., 'Top 10 Ghost Tours')")
    roundup_parser.add_argument("--niche", default="haunted", help="Tour niche")
    roundup_parser.add_argument("--count", type=int, default=5, help="Number of tours")
    roundup_parser.add_argument("--min-rating", type=float, default=4.5, help="Minimum rating")
    roundup_parser.add_argument("--destination", help="Filter by destination")
    roundup_parser.add_argument("--publish", action="store_true", help="Publish immediately")

    # Preview command
    preview_parser = subparsers.add_parser("preview", help="Preview article without publishing")
    preview_parser.add_argument("code", help="Viator product code")

    # List products command
    list_parser = subparsers.add_parser("list", help="List available products")
    list_parser.add_argument("--niche", default="haunted", help="Tour niche")
    list_parser.add_argument("--limit", type=int, default=10, help="Number of products")
    list_parser.add_argument("--destination", help="Filter by destination")

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
            print(json.dumps(result, indent=2))

        elif args.command == "destination":
            result = generator.generate_destination_guide(
                destination=args.name,
                niche=args.niche,
                max_tours=args.max_tours,
                publish=args.publish
            )
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
            print(json.dumps(result, indent=2))

        elif args.command == "preview":
            result = generator.preview_article(args.code)
            print(json.dumps(result, indent=2))

        elif args.command == "list":
            if args.destination:
                products = generator.products.search_by_destination(
                    args.destination, niche=args.niche, limit=args.limit
                )
            else:
                data = generator.products.get_products(niche=args.niche, limit=args.limit)
                products = data.get("products", [])

            for p in products:
                print(f"[{p.get('productCode')}] {p.get('title')}")
                print(f"    {p.get('destinationName')} | ${p.get('priceFrom', 0):.2f} | {p.get('rating', 'N/A')}/5")
                print()

        else:
            parser.print_help()

    except Exception as e:
        print(f"Error: {e}")
        raise


if __name__ == "__main__":
    main()
