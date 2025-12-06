import type { Express } from "express";
import { createServer, type Server } from "http";

const WP_API_URL = "https://wp.cursedtours.com/wp-json/wp/v2";

// Cache for WordPress data
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class WordPressAPIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "WordPressAPIError";
  }
}

async function fetchWithCache(url: string, cacheKey: string): Promise<any> {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new WordPressAPIError(
      `WordPress API error: ${response.status} - ${errorText}`,
      response.status
    );
  }

  const data = await response.json();
  const totalPages = response.headers.get("X-WP-TotalPages");
  const totalPosts = response.headers.get("X-WP-Total");

  const result = { data, totalPages, totalPosts };
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const { data } = await fetchWithCache(
        `${WP_API_URL}/categories?per_page=100`,
        "categories"
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      const status = error instanceof WordPressAPIError ? error.status : 500;
      res.status(status).json({ error: "Failed to fetch categories" });
    }
  });

  // Get all tags
  app.get("/api/tags", async (req, res) => {
    try {
      const { data } = await fetchWithCache(
        `${WP_API_URL}/tags?per_page=100`,
        "tags"
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
      const status = error instanceof WordPressAPIError ? error.status : 500;
      res.status(status).json({ error: "Failed to fetch tags" });
    }
  });

  // Get posts with pagination and filters
  app.get("/api/posts", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;
      const category = req.query.category as string;
      const tag = req.query.tag as string;
      const search = req.query.search as string;
      const author = req.query.author as string;

      let url = `${WP_API_URL}/posts?page=${page}&per_page=${perPage}&_embed=true`;

      // Add category filter (by slug)
      if (category) {
        // First get category ID from slug
        const { data: categories } = await fetchWithCache(
          `${WP_API_URL}/categories?slug=${category}`,
          `category-slug-${category}`
        );
        if (categories.length > 0) {
          url += `&categories=${categories[0].id}`;
        }
      }

      // Add tag filter (by slug)
      if (tag) {
        const { data: tags } = await fetchWithCache(
          `${WP_API_URL}/tags?slug=${tag}`,
          `tag-slug-${tag}`
        );
        if (tags.length > 0) {
          url += `&tags=${tags[0].id}`;
        }
      }

      // Add search filter
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      // Add author filter
      if (author) {
        url += `&author=${author}`;
      }

      const cacheKey = `posts-${page}-${perPage}-${category || ""}-${tag || ""}-${search || ""}-${author || ""}`;
      const { data, totalPages, totalPosts } = await fetchWithCache(url, cacheKey);

      res.json({
        posts: data,
        totalPages: parseInt(totalPages || "1"),
        totalPosts: parseInt(totalPosts || "0"),
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      const status = error instanceof WordPressAPIError ? error.status : 500;
      res.status(status).json({ error: "Failed to fetch posts" });
    }
  });

  // Get single post by slug
  app.get("/api/posts/:slug", async (req, res) => {
    try {
      const { slug } = req.params;

      // Fetch the post by slug
      const { data: posts } = await fetchWithCache(
        `${WP_API_URL}/posts?slug=${slug}&_embed=true`,
        `post-${slug}`
      );

      if (!posts || posts.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      const post = posts[0];

      // Fetch related posts from the same category
      let relatedPosts: any[] = [];
      if (post.categories && post.categories.length > 0) {
        const categoryId = post.categories[0];
        const { data: related } = await fetchWithCache(
          `${WP_API_URL}/posts?categories=${categoryId}&per_page=4&exclude=${post.id}&_embed=true`,
          `related-${post.id}-${categoryId}`
        );
        relatedPosts = related;
      }

      res.json({
        post,
        relatedPosts,
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      const status = error instanceof WordPressAPIError ? error.status : 500;
      res.status(status).json({ error: "Failed to fetch post" });
    }
  });

  // Get authors
  app.get("/api/authors", async (req, res) => {
    try {
      const { data } = await fetchWithCache(
        `${WP_API_URL}/users?per_page=100`,
        "authors"
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching authors:", error);
      const status = error instanceof WordPressAPIError ? error.status : 500;
      res.status(status).json({ error: "Failed to fetch authors" });
    }
  });

  // Get single author by ID
  app.get("/api/authors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { data } = await fetchWithCache(
        `${WP_API_URL}/users/${id}`,
        `author-${id}`
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching author:", error);
      const status = error instanceof WordPressAPIError ? error.status : 500;
      res.status(status).json({ error: "Failed to fetch author" });
    }
  });

  // Clear cache endpoint (for development)
  app.post("/api/cache/clear", (req, res) => {
    cache.clear();
    res.json({ message: "Cache cleared" });
  });

  return httpServer;
}
