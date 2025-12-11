import { z } from "zod";
import { pgTable, text, timestamp, decimal, integer, boolean, jsonb, uuid, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ============================================================
// DRIZZLE DATABASE TABLES
// ============================================================

// Articles table - AI-generated tour articles
export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  productCode: varchar("product_code", { length: 50 }).unique().notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),

  // Content
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  metaDescription: varchar("meta_description", { length: 160 }),
  focusKeyphrase: varchar("focus_keyphrase", { length: 100 }),
  secondaryKeywords: text("secondary_keywords"), // comma-separated

  // Schema markup (JSON-LD)
  schemaJson: jsonb("schema_json"),

  // Tour data (denormalized for quick access)
  destination: varchar("destination", { length: 100 }),
  bookingUrl: text("booking_url"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count"),
  durationMinutes: integer("duration_minutes"),

  // Media
  featuredImageUrl: text("featured_image_url"),
  featuredImageAlt: text("featured_image_alt"),

  // Structured content (JSON sections for consistent rendering)
  contentSections: jsonb("content_sections"),

  // Tour details
  inclusions: text("inclusions").array(),
  exclusions: text("exclusions").array(),
  meetingPoint: text("meeting_point"),
  accessibility: text("accessibility"),

  // Status
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft, published, archived
  articleType: varchar("article_type", { length: 30 }).default("tour").notNull(), // tour, destination, roundup
  niche: varchar("niche", { length: 30 }).default("haunted"), // haunted, culinary

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),

  // Generation metadata
  generatedBy: varchar("generated_by", { length: 50 }).default("ollama"),
  generationModel: varchar("generation_model", { length: 50 }),
  wordCount: integer("word_count"),
}, (table) => ({
  slugIdx: index("articles_slug_idx").on(table.slug),
  destinationIdx: index("articles_destination_idx").on(table.destination),
  statusIdx: index("articles_status_idx").on(table.status),
  productCodeIdx: index("articles_product_code_idx").on(table.productCode),
}));

// Destinations table - for destination guide pages
export const destinations = pgTable("destinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),

  // Content
  description: text("description"),
  hauntedHistory: text("haunted_history"),

  // Stats (updated periodically)
  tourCount: integer("tour_count").default(0),
  avgRating: decimal("avg_rating", { precision: 2, scale: 1 }),

  // Media
  featuredImageUrl: text("featured_image_url"),

  // SEO
  metaDescription: varchar("meta_description", { length: 160 }),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("destinations_name_idx").on(table.name),
}));

// FAQs table - for FAQ schema markup
export const articleFaqs = pgTable("article_faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0),
}, (table) => ({
  articleIdx: index("article_faqs_article_idx").on(table.articleId),
}));

// Related articles junction table
export const relatedArticles = pgTable("related_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  relatedArticleId: uuid("related_article_id").references(() => articles.id, { onDelete: "cascade" }).notNull(),
  sortOrder: integer("sort_order").default(0),
}, (table) => ({
  articleIdx: index("related_articles_article_idx").on(table.articleId),
}));

// ============================================================
// BLOG POSTS (migrated from WordPress)
// ============================================================

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  wpId: integer("wp_id").unique(), // Original WordPress ID
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  count: integer("count").default(0),
}, (table) => ({
  slugIdx: index("categories_slug_idx").on(table.slug),
}));

// Authors table
export const authors = pgTable("authors", {
  id: uuid("id").primaryKey().defaultRandom(),
  wpId: integer("wp_id").unique(), // Original WordPress ID
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
}, (table) => ({
  slugIdx: index("authors_slug_idx").on(table.slug),
}));

// Posts table (migrated from WordPress)
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  wpId: integer("wp_id").unique(), // Original WordPress ID for reference
  slug: varchar("slug", { length: 255 }).unique().notNull(),

  // Content
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),

  // Author
  authorId: uuid("author_id").references(() => authors.id),

  // Media
  featuredImageUrl: text("featured_image_url"),
  featuredImageAlt: text("featured_image_alt"),

  // Status
  status: varchar("status", { length: 20 }).default("published").notNull(),

  // SEO
  metaDescription: varchar("meta_description", { length: 160 }),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),

  // Reading stats
  wordCount: integer("word_count"),
  readingTimeMinutes: integer("reading_time_minutes"),
}, (table) => ({
  slugIdx: index("posts_slug_idx").on(table.slug),
  statusIdx: index("posts_status_idx").on(table.status),
  authorIdx: index("posts_author_idx").on(table.authorId),
}));

// Post categories junction table
export const postCategories = pgTable("post_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
}, (table) => ({
  postIdx: index("post_categories_post_idx").on(table.postId),
  categoryIdx: index("post_categories_category_idx").on(table.categoryId),
}));

// Zod schemas for validation
export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);
export const insertDestinationSchema = createInsertSchema(destinations);
export const selectDestinationSchema = createSelectSchema(destinations);
export const insertFaqSchema = createInsertSchema(articleFaqs);
export const selectFaqSchema = createSelectSchema(articleFaqs);
export const insertPostSchema = createInsertSchema(posts);
export const selectPostSchema = createSelectSchema(posts);
export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);
export const insertAuthorSchema = createInsertSchema(authors);
export const selectAuthorSchema = createSelectSchema(authors);

// TypeScript types
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Destination = typeof destinations.$inferSelect;
export type NewDestination = typeof destinations.$inferInsert;
export type ArticleFaq = typeof articleFaqs.$inferSelect;
export type NewArticleFaq = typeof articleFaqs.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;

// ============================================================
// WORDPRESS REST API TYPES (existing)
// ============================================================

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


// ============================================================
// INTERNAL LINKING SYSTEM
// ============================================================

// Post embeddings for similarity search
export const postEmbeddings = pgTable("post_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).unique().notNull(),
  embedding: text("embedding").notNull(), // JSON stringified float32 array
  contentHash: varchar("content_hash", { length: 32 }), // MD5 hash to detect changes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  postIdx: index("post_embeddings_post_idx").on(table.postId),
}));

// Internal links tracking
export const internalLinks = pgTable("internal_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourcePostId: uuid("source_post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  targetPostId: uuid("target_post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  anchorText: text("anchor_text").notNull(),
  position: integer("position"), // Character position in content
  similarity: decimal("similarity", { precision: 4, scale: 3 }), // Cosine similarity score
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index("internal_links_source_idx").on(table.sourcePostId),
  targetIdx: index("internal_links_target_idx").on(table.targetPostId),
}));

// Processing log for debugging
export const linkingLog = pgTable("linking_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(), // 'embed', 'link', 'update', 'error'
  status: varchar("status", { length: 20 }).notNull(), // 'success', 'error', 'skipped'
  message: text("message"),
  linksAdded: integer("links_added").default(0),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

// Types for internal linking
export type PostEmbedding = typeof postEmbeddings.$inferSelect;
export type NewPostEmbedding = typeof postEmbeddings.$inferInsert;
export type InternalLink = typeof internalLinks.$inferSelect;
export type NewInternalLink = typeof internalLinks.$inferInsert;
export type LinkingLog = typeof linkingLog.$inferSelect;
