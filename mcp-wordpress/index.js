#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const WP_BASE_URL = process.env.WORDPRESS_URL || 'https://wp.cursedtours.com';
const WP_API_URL = `${WP_BASE_URL}/wp-json/wp/v2`;

// Helper function to fetch from WordPress API
async function fetchWP(endpoint, params = {}) {
  const url = new URL(`${WP_API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const totalPages = response.headers.get('X-WP-TotalPages');
  const total = response.headers.get('X-WP-Total');

  return { data, totalPages, total };
}

// Fetch from any WP JSON endpoint
async function fetchWPJson(path) {
  const response = await fetch(`${WP_BASE_URL}/wp-json${path}`);
  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Strip HTML tags from content
function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim() || '';
}

// Create the MCP server
const server = new Server(
  {
    name: 'wordpress-cursedtours',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Posts
      {
        name: 'get_posts',
        description: 'Fetch posts from cursedtours.com WordPress site. Returns list of posts with title, excerpt, date, categories, and featured image.',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number (default: 1)' },
            per_page: { type: 'number', description: 'Posts per page (default: 10, max: 100)' },
            search: { type: 'string', description: 'Search term to filter posts' },
            categories: { type: 'string', description: 'Category ID to filter by' },
            tags: { type: 'string', description: 'Tag ID to filter by' },
            author: { type: 'number', description: 'Author ID to filter by' },
            orderby: { type: 'string', description: 'Order by: date, title, id, modified (default: date)' },
            order: { type: 'string', description: 'Order: asc or desc (default: desc)' },
            status: { type: 'string', description: 'Post status: publish, draft, pending (default: publish)' },
          },
        },
      },
      {
        name: 'get_post',
        description: 'Fetch a single post by slug or ID from cursedtours.com with full content',
        inputSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Post slug (URL-friendly name)' },
            id: { type: 'number', description: 'Post ID' },
          },
        },
      },
      // Pages
      {
        name: 'get_pages',
        description: 'Fetch pages from cursedtours.com WordPress site',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number (default: 1)' },
            per_page: { type: 'number', description: 'Pages per page (default: 10, max: 100)' },
            search: { type: 'string', description: 'Search term to filter pages' },
            parent: { type: 'number', description: 'Parent page ID' },
            orderby: { type: 'string', description: 'Order by: date, title, id, menu_order (default: menu_order)' },
            order: { type: 'string', description: 'Order: asc or desc (default: asc)' },
          },
        },
      },
      {
        name: 'get_page',
        description: 'Fetch a single page by slug or ID from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            slug: { type: 'string', description: 'Page slug' },
            id: { type: 'number', description: 'Page ID' },
          },
        },
      },
      // Categories
      {
        name: 'get_categories',
        description: 'Fetch all categories from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: { type: 'number', description: 'Categories per page (default: 100)' },
            parent: { type: 'number', description: 'Parent category ID (0 for top-level)' },
            hide_empty: { type: 'boolean', description: 'Hide empty categories (default: true)' },
          },
        },
      },
      // Tags
      {
        name: 'get_tags',
        description: 'Fetch all tags from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: { type: 'number', description: 'Tags per page (default: 100)' },
            search: { type: 'string', description: 'Search tags by name' },
            hide_empty: { type: 'boolean', description: 'Hide empty tags (default: true)' },
          },
        },
      },
      // Media
      {
        name: 'get_media',
        description: 'Fetch media items (images) from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: { type: 'number', description: 'Media items per page (default: 10)' },
            search: { type: 'string', description: 'Search term for media' },
            media_type: { type: 'string', description: 'Filter by type: image, video, audio' },
          },
        },
      },
      // Authors/Users
      {
        name: 'get_authors',
        description: 'Fetch authors/users from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: { type: 'number', description: 'Authors per page (default: 10)' },
            search: { type: 'string', description: 'Search authors by name' },
          },
        },
      },
      // Comments
      {
        name: 'get_comments',
        description: 'Fetch comments from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            post: { type: 'number', description: 'Filter by post ID' },
            per_page: { type: 'number', description: 'Comments per page (default: 10)' },
            order: { type: 'string', description: 'Order: asc or desc (default: desc)' },
          },
        },
      },
      // SEO - Yoast/RankMath endpoints
      {
        name: 'get_seo_meta',
        description: 'Fetch SEO metadata for a post or page (works with Yoast SEO, RankMath, or All in One SEO)',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Content type: post or page (default: post)' },
            slug: { type: 'string', description: 'Post/page slug' },
            id: { type: 'number', description: 'Post/page ID' },
          },
        },
      },
      // Site Info
      {
        name: 'get_site_info',
        description: 'Get site information, available routes, and plugin endpoints from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // Menu/Navigation
      {
        name: 'get_menus',
        description: 'Fetch navigation menus from cursedtours.com (if menu REST API is enabled)',
        inputSchema: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'Menu location (e.g., primary, footer)' },
          },
        },
      },
      // Search
      {
        name: 'search_content',
        description: 'Search all content (posts, pages) on cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query (required)' },
            type: { type: 'string', description: 'Content type: post, page, or all (default: all)' },
            per_page: { type: 'number', description: 'Results per page (default: 10)' },
          },
          required: ['query'],
        },
      },
      // Taxonomies
      {
        name: 'get_taxonomies',
        description: 'List all available taxonomies on cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // Post Types
      {
        name: 'get_post_types',
        description: 'List all available post types on cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_posts': {
        const { data, totalPages, total } = await fetchWP('/posts', {
          page: args?.page || 1,
          per_page: args?.per_page || 10,
          search: args?.search,
          categories: args?.categories,
          tags: args?.tags,
          author: args?.author,
          orderby: args?.orderby || 'date',
          order: args?.order || 'desc',
          status: args?.status || 'publish',
          _embed: true,
        });

        const posts = data.map((post) => ({
          id: post.id,
          title: stripHtml(post.title?.rendered),
          slug: post.slug,
          date: post.date,
          modified: post.modified,
          excerpt: stripHtml(post.excerpt?.rendered).slice(0, 300),
          link: post.link,
          categories: post._embedded?.['wp:term']?.[0]?.map((c) => ({ id: c.id, name: c.name, slug: c.slug })) || [],
          tags: post._embedded?.['wp:term']?.[1]?.map((t) => ({ id: t.id, name: t.name, slug: t.slug })) || [],
          featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          author: post._embedded?.author?.[0]?.name || 'Unknown',
          // SEO fields if available (Yoast)
          seo: post.yoast_head_json || post.rank_math || null,
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify({ posts, totalPages: parseInt(totalPages), total: parseInt(total) }, null, 2) }],
        };
      }

      case 'get_post': {
        let post;
        if (args?.slug) {
          const { data } = await fetchWP('/posts', { slug: args.slug, _embed: true });
          post = data[0];
        } else if (args?.id) {
          const response = await fetch(`${WP_API_URL}/posts/${args.id}?_embed=true`);
          post = await response.json();
        } else {
          throw new Error('Either slug or id is required');
        }

        if (!post) {
          return { content: [{ type: 'text', text: 'Post not found' }] };
        }

        const result = {
          id: post.id,
          title: stripHtml(post.title?.rendered),
          slug: post.slug,
          date: post.date,
          modified: post.modified,
          content: post.content?.rendered, // Full HTML content
          contentText: stripHtml(post.content?.rendered).slice(0, 3000), // Plain text preview
          excerpt: stripHtml(post.excerpt?.rendered),
          link: post.link,
          status: post.status,
          categories: post._embedded?.['wp:term']?.[0]?.map((c) => ({ id: c.id, name: c.name, slug: c.slug })) || [],
          tags: post._embedded?.['wp:term']?.[1]?.map((t) => ({ id: t.id, name: t.name, slug: t.slug })) || [],
          featuredImage: post._embedded?.['wp:featuredmedia']?.[0] ? {
            url: post._embedded['wp:featuredmedia'][0].source_url,
            alt: post._embedded['wp:featuredmedia'][0].alt_text,
            width: post._embedded['wp:featuredmedia'][0].media_details?.width,
            height: post._embedded['wp:featuredmedia'][0].media_details?.height,
          } : null,
          author: post._embedded?.author?.[0] ? {
            id: post._embedded.author[0].id,
            name: post._embedded.author[0].name,
            avatar: post._embedded.author[0].avatar_urls?.['96'],
          } : null,
          // SEO data
          seo: post.yoast_head_json || post.rank_math || null,
        };

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_pages': {
        const { data, totalPages, total } = await fetchWP('/pages', {
          page: args?.page || 1,
          per_page: args?.per_page || 10,
          search: args?.search,
          parent: args?.parent,
          orderby: args?.orderby || 'menu_order',
          order: args?.order || 'asc',
          _embed: true,
        });

        const pages = data.map((page) => ({
          id: page.id,
          title: stripHtml(page.title?.rendered),
          slug: page.slug,
          date: page.date,
          modified: page.modified,
          excerpt: stripHtml(page.excerpt?.rendered).slice(0, 300),
          link: page.link,
          parent: page.parent,
          menuOrder: page.menu_order,
          featuredImage: page._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          template: page.template,
          seo: page.yoast_head_json || page.rank_math || null,
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify({ pages, totalPages: parseInt(totalPages), total: parseInt(total) }, null, 2) }],
        };
      }

      case 'get_page': {
        let page;
        if (args?.slug) {
          const { data } = await fetchWP('/pages', { slug: args.slug, _embed: true });
          page = data[0];
        } else if (args?.id) {
          const response = await fetch(`${WP_API_URL}/pages/${args.id}?_embed=true`);
          page = await response.json();
        } else {
          throw new Error('Either slug or id is required');
        }

        if (!page) {
          return { content: [{ type: 'text', text: 'Page not found' }] };
        }

        const result = {
          id: page.id,
          title: stripHtml(page.title?.rendered),
          slug: page.slug,
          date: page.date,
          modified: page.modified,
          content: page.content?.rendered,
          contentText: stripHtml(page.content?.rendered).slice(0, 3000),
          excerpt: stripHtml(page.excerpt?.rendered),
          link: page.link,
          parent: page.parent,
          menuOrder: page.menu_order,
          template: page.template,
          featuredImage: page._embedded?.['wp:featuredmedia']?.[0] ? {
            url: page._embedded['wp:featuredmedia'][0].source_url,
            alt: page._embedded['wp:featuredmedia'][0].alt_text,
          } : null,
          seo: page.yoast_head_json || page.rank_math || null,
        };

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_categories': {
        const { data } = await fetchWP('/categories', {
          per_page: args?.per_page || 100,
          parent: args?.parent,
          hide_empty: args?.hide_empty !== false,
          orderby: 'count',
          order: 'desc',
        });

        const categories = data.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat.count,
          description: cat.description,
          parent: cat.parent,
          link: cat.link,
        }));

        return { content: [{ type: 'text', text: JSON.stringify(categories, null, 2) }] };
      }

      case 'get_tags': {
        const { data } = await fetchWP('/tags', {
          per_page: args?.per_page || 100,
          search: args?.search,
          hide_empty: args?.hide_empty !== false,
          orderby: 'count',
          order: 'desc',
        });

        const tags = data.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          count: tag.count,
          link: tag.link,
        }));

        return { content: [{ type: 'text', text: JSON.stringify(tags, null, 2) }] };
      }

      case 'get_media': {
        const { data } = await fetchWP('/media', {
          per_page: args?.per_page || 10,
          search: args?.search,
          media_type: args?.media_type,
        });

        const media = data.map((item) => ({
          id: item.id,
          title: stripHtml(item.title?.rendered),
          url: item.source_url,
          alt: item.alt_text,
          caption: stripHtml(item.caption?.rendered),
          mimeType: item.mime_type,
          width: item.media_details?.width,
          height: item.media_details?.height,
          sizes: item.media_details?.sizes ? Object.entries(item.media_details.sizes).map(([name, size]) => ({
            name,
            url: size.source_url,
            width: size.width,
            height: size.height,
          })) : [],
        }));

        return { content: [{ type: 'text', text: JSON.stringify(media, null, 2) }] };
      }

      case 'get_authors': {
        const { data } = await fetchWP('/users', {
          per_page: args?.per_page || 10,
          search: args?.search,
        });

        const authors = data.map((user) => ({
          id: user.id,
          name: user.name,
          slug: user.slug,
          description: user.description,
          link: user.link,
          avatar: user.avatar_urls?.['96'],
        }));

        return { content: [{ type: 'text', text: JSON.stringify(authors, null, 2) }] };
      }

      case 'get_comments': {
        const { data, total } = await fetchWP('/comments', {
          post: args?.post,
          per_page: args?.per_page || 10,
          order: args?.order || 'desc',
        });

        const comments = data.map((comment) => ({
          id: comment.id,
          postId: comment.post,
          parent: comment.parent,
          author: comment.author_name,
          date: comment.date,
          content: stripHtml(comment.content?.rendered),
          link: comment.link,
        }));

        return { content: [{ type: 'text', text: JSON.stringify({ comments, total: parseInt(total) }, null, 2) }] };
      }

      case 'get_seo_meta': {
        const type = args?.type || 'post';
        const endpoint = type === 'page' ? '/pages' : '/posts';

        let item;
        if (args?.slug) {
          const { data } = await fetchWP(endpoint, { slug: args.slug });
          item = data[0];
        } else if (args?.id) {
          const response = await fetch(`${WP_API_URL}${endpoint}/${args.id}`);
          item = await response.json();
        } else {
          throw new Error('Either slug or id is required');
        }

        if (!item) {
          return { content: [{ type: 'text', text: `${type} not found` }] };
        }

        // Extract SEO data from various plugins
        const seo = {
          title: stripHtml(item.title?.rendered),
          // Yoast SEO
          yoast: item.yoast_head_json || null,
          // RankMath
          rankMath: item.rank_math || null,
          // Basic meta
          excerpt: stripHtml(item.excerpt?.rendered),
          slug: item.slug,
          link: item.link,
          modified: item.modified,
        };

        return { content: [{ type: 'text', text: JSON.stringify(seo, null, 2) }] };
      }

      case 'get_site_info': {
        const data = await fetchWPJson('');

        const info = {
          name: data.name,
          description: data.description,
          url: data.url,
          home: data.home,
          gmt_offset: data.gmt_offset,
          timezone_string: data.timezone_string,
          namespaces: data.namespaces,
          routes: Object.keys(data.routes || {}).slice(0, 50),
        };

        return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] };
      }

      case 'get_menus': {
        // Try different menu endpoints
        let menus = [];
        try {
          // WP REST API v2 Menus plugin
          menus = await fetchWPJson('/wp/v2/menus');
        } catch {
          try {
            // Alternative menu endpoint
            menus = await fetchWPJson('/menus/v1/menus');
          } catch {
            try {
              // WP REST API Menus
              const response = await fetch(`${WP_BASE_URL}/wp-json/wp-api-menus/v2/menus`);
              menus = await response.json();
            } catch {
              return { content: [{ type: 'text', text: 'Menu REST API not available. Install WP REST API Menus plugin.' }] };
            }
          }
        }

        return { content: [{ type: 'text', text: JSON.stringify(menus, null, 2) }] };
      }

      case 'search_content': {
        if (!args?.query) {
          throw new Error('Search query is required');
        }

        const results = [];
        const type = args?.type || 'all';
        const perPage = args?.per_page || 10;

        if (type === 'all' || type === 'post') {
          const { data: posts } = await fetchWP('/posts', { search: args.query, per_page: perPage, _embed: true });
          results.push(...posts.map((p) => ({
            type: 'post',
            id: p.id,
            title: stripHtml(p.title?.rendered),
            slug: p.slug,
            excerpt: stripHtml(p.excerpt?.rendered).slice(0, 200),
            link: p.link,
            date: p.date,
          })));
        }

        if (type === 'all' || type === 'page') {
          const { data: pages } = await fetchWP('/pages', { search: args.query, per_page: perPage, _embed: true });
          results.push(...pages.map((p) => ({
            type: 'page',
            id: p.id,
            title: stripHtml(p.title?.rendered),
            slug: p.slug,
            excerpt: stripHtml(p.excerpt?.rendered).slice(0, 200),
            link: p.link,
            date: p.date,
          })));
        }

        return { content: [{ type: 'text', text: JSON.stringify({ query: args.query, results }, null, 2) }] };
      }

      case 'get_taxonomies': {
        const data = await fetchWPJson('/wp/v2/taxonomies');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      case 'get_post_types': {
        const data = await fetchWPJson('/wp/v2/types');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WordPress MCP server running for cursedtours.com');
}

main().catch(console.error);
