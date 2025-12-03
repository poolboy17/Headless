import { z } from "zod";

// WordPress REST API Types

export const wpMediaSchema = z.object({
  id: z.number(),
  source_url: z.string(),
  alt_text: z.string().optional(),
  media_details: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    sizes: z.record(z.object({
      source_url: z.string(),
      width: z.number(),
      height: z.number(),
    })).optional(),
  }).optional(),
});

export const wpCategorySchema = z.object({
  id: z.number(),
  count: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  link: z.string(),
});

export const wpTagSchema = z.object({
  id: z.number(),
  count: z.number(),
  name: z.string(),
  slug: z.string(),
  link: z.string(),
});

export const wpAuthorSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  avatar_urls: z.record(z.string()).optional(),
  link: z.string(),
});

export const wpPostSchema = z.object({
  id: z.number(),
  date: z.string(),
  date_gmt: z.string(),
  modified: z.string(),
  modified_gmt: z.string(),
  slug: z.string(),
  status: z.string(),
  type: z.string(),
  link: z.string(),
  title: z.object({
    rendered: z.string(),
  }),
  content: z.object({
    rendered: z.string(),
    protected: z.boolean().optional(),
  }),
  excerpt: z.object({
    rendered: z.string(),
    protected: z.boolean().optional(),
  }),
  author: z.number(),
  featured_media: z.number(),
  categories: z.array(z.number()),
  tags: z.array(z.number()),
});

// Enriched post with embedded data
export const enrichedPostSchema = wpPostSchema.extend({
  _embedded: z.object({
    author: z.array(wpAuthorSchema).optional(),
    "wp:featuredmedia": z.array(wpMediaSchema).optional(),
    "wp:term": z.array(z.array(z.union([wpCategorySchema, wpTagSchema]))).optional(),
  }).optional(),
});

// Types
export type WPMedia = z.infer<typeof wpMediaSchema>;
export type WPCategory = z.infer<typeof wpCategorySchema>;
export type WPTag = z.infer<typeof wpTagSchema>;
export type WPAuthor = z.infer<typeof wpAuthorSchema>;
export type WPPost = z.infer<typeof wpPostSchema>;
export type EnrichedPost = z.infer<typeof enrichedPostSchema>;

// API Response types
export interface PostsResponse {
  posts: EnrichedPost[];
  totalPages: number;
  totalPosts: number;
}

export interface SinglePostResponse {
  post: EnrichedPost;
  relatedPosts: EnrichedPost[];
}

// Search params
export interface PostQueryParams {
  page?: number;
  perPage?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
  author?: number;
}
