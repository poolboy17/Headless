#!/usr/bin/env python3
"""
Batch Tour Page Generator

Generates SEO-optimized splash pages for all Viator tour products.
Uses local Ollama for AI content generation and saves to Neon database.

Usage:
  python scripts/generate-tour-pages.py [options]

Options:
  --limit N         Generate for first N products (default: all)
  --destination D   Filter by destination (e.g., "New Orleans")
  --min-rating R    Minimum rating filter (default: 4.0)
  --publish         Publish immediately (default: draft)
  --dry-run         Show what would be generated without doing it

Environment:
  PRODUCTS_API_URL  Viator products API (default: replit URL)
  ARTICLES_API_URL  Articles API endpoint
  OLLAMA_URL        Ollama server (default: http://localhost:11434)
  OLLAMA_MODEL      Model to use (default: llama3.2)

Example:
  # Generate pages for top-rated New Orleans tours
  python scripts/generate-tour-pages.py --destination "New Orleans" --min-rating 4.5 --limit 10

  # Generate all tours and publish
  python scripts/generate-tour-pages.py --publish
"""

import os
import sys
import time
import argparse
import requests
from typing import List, Dict

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'article-generator'))

# Configuration
PRODUCTS_API_URL = os.getenv("PRODUCTS_API_URL", "https://viator-haunts--genaromvasquez.replit.app")
ARTICLES_API_URL = os.getenv("ARTICLES_API_URL", "https://cursedtours.com/api/articles")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


def check_ollama() -> bool:
    """Check if Ollama is running and has the required model"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if response.status_code != 200:
            return False

        models = [m["name"] for m in response.json().get("models", [])]
        model_base = OLLAMA_MODEL.split(":")[0]

        if not any(model_base in m for m in models):
            print(f"Warning: Model '{OLLAMA_MODEL}' not found. Available: {models}")
            return False

        return True
    except Exception as e:
        print(f"Error connecting to Ollama: {e}")
        return False


def get_products(limit: int = 100, destination: str = None, min_rating: float = 0) -> List[Dict]:
    """Fetch products from the Viator API"""
    url = f"{PRODUCTS_API_URL}/api/niches/haunted/products"

    try:
        response = requests.get(url, params={"limit": 500}, timeout=30)
        response.raise_for_status()
        products = response.json().get("products", [])

        # Filter by destination
        if destination:
            products = [
                p for p in products
                if destination.lower() in (p.get("destinationName") or "").lower()
            ]

        # Filter by rating
        if min_rating > 0:
            products = [
                p for p in products
                if (p.get("rating") or 0) >= min_rating
            ]

        # Filter active products only
        products = [p for p in products if p.get("isActive")]

        # Sort by rating and reviews
        products.sort(
            key=lambda x: ((x.get("rating") or 0), (x.get("reviewCount") or 0)),
            reverse=True
        )

        return products[:limit] if limit else products

    except Exception as e:
        print(f"Error fetching products: {e}")
        return []


def get_existing_articles() -> set:
    """Get set of product codes that already have articles"""
    try:
        response = requests.get(f"{ARTICLES_API_URL}?limit=1000", timeout=30)
        if response.status_code == 200:
            data = response.json()
            articles = data.get("articles", [])
            return {a.get("productCode") for a in articles if a.get("productCode")}
    except:
        pass
    return set()


def generate_article(product: Dict, publish: bool = False) -> Dict:
    """Generate an article for a single product using the generator"""
    from generator import ArticleGenerator

    generator = ArticleGenerator(use_database=True)

    result = generator.generate_tour_article(
        product_code=product.get("productCode"),
        publish=publish
    )

    return result


def main():
    parser = argparse.ArgumentParser(description="Batch generate tour splash pages")
    parser.add_argument("--limit", type=int, help="Limit number of products")
    parser.add_argument("--destination", help="Filter by destination")
    parser.add_argument("--min-rating", type=float, default=4.0, help="Minimum rating (default: 4.0)")
    parser.add_argument("--publish", action="store_true", help="Publish immediately")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated")
    parser.add_argument("--skip-existing", action="store_true", default=True, help="Skip products with existing articles")

    args = parser.parse_args()

    print("=" * 60)
    print("CURSED TOURS - Batch Tour Page Generator")
    print("=" * 60)

    # Check Ollama
    if not args.dry_run:
        print("\nChecking Ollama...")
        if not check_ollama():
            print("\nError: Ollama is not running or model not available.")
            print(f"Please start Ollama and ensure '{OLLAMA_MODEL}' is installed:")
            print(f"  ollama pull {OLLAMA_MODEL}")
            sys.exit(1)
        print(f"Ollama OK - Using model: {OLLAMA_MODEL}")

    # Fetch products
    print(f"\nFetching products from {PRODUCTS_API_URL}...")
    products = get_products(
        limit=args.limit or 1000,
        destination=args.destination,
        min_rating=args.min_rating
    )

    if not products:
        print("No products found matching criteria.")
        sys.exit(0)

    print(f"Found {len(products)} products")

    # Get existing articles to skip
    existing = set()
    if args.skip_existing and not args.dry_run:
        print("\nChecking for existing articles...")
        existing = get_existing_articles()
        print(f"Found {len(existing)} existing articles")

    # Filter out existing
    to_generate = [p for p in products if p.get("productCode") not in existing]
    print(f"\nWill generate {len(to_generate)} new articles")

    if args.dry_run:
        print("\n--- DRY RUN ---")
        print("\nProducts to generate:")
        for i, p in enumerate(to_generate[:20], 1):
            print(f"  {i}. [{p.get('productCode')}] {p.get('title')}")
            print(f"      {p.get('destinationName')} | ${p.get('priceFrom', 0):.2f} | {p.get('rating', 'N/A')}/5")
        if len(to_generate) > 20:
            print(f"  ... and {len(to_generate) - 20} more")
        return

    # Generate articles
    print(f"\nStarting generation ({'publish' if args.publish else 'draft'} mode)...")
    print("This will take a while - each article takes 1-3 minutes\n")

    success = 0
    failed = 0

    for i, product in enumerate(to_generate, 1):
        code = product.get("productCode")
        title = product.get("title", "Unknown")[:50]

        print(f"\n[{i}/{len(to_generate)}] Generating: {title}...")
        print(f"    Code: {code}")

        try:
            start = time.time()
            result = generate_article(product, publish=args.publish)
            elapsed = time.time() - start

            if result.get("success"):
                success += 1
                print(f"    ✓ Success ({elapsed:.1f}s)")
                print(f"    Words: {result.get('content_length', 0)}")
            else:
                failed += 1
                print(f"    ✗ Failed: {result.get('error', 'Unknown error')}")

        except Exception as e:
            failed += 1
            print(f"    ✗ Error: {e}")

        # Brief pause between generations
        if i < len(to_generate):
            time.sleep(2)

    # Summary
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"  Success: {success}")
    print(f"  Failed:  {failed}")
    print(f"  Total:   {len(to_generate)}")

    if success > 0:
        print(f"\nView your articles at: https://cursedtours.com/tour/")


if __name__ == "__main__":
    main()
