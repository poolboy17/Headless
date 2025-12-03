#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const WP_BASE_URL = process.env.WORDPRESS_URL || 'https://cursedtours.com';
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
      {
        name: 'get_posts',
        description: 'Fetch posts from cursedtours.com WordPress site. Returns list of posts with title, excerpt, date, categories, and featured image.',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number (default: 1)',
            },
            per_page: {
              type: 'number',
              description: 'Posts per page (default: 10, max: 100)',
            },
            search: {
              type: 'string',
              description: 'Search term to filter posts',
            },
            categories: {
              type: 'string',
              description: 'Category ID to filter by',
            },
            orderby: {
              type: 'string',
              description: 'Order by: date, title, id (default: date)',
            },
            order: {
              type: 'string',
              description: 'Order: asc or desc (default: desc)',
            },
          },
        },
      },
      {
        name: 'get_post',
        description: 'Fetch a single post by slug or ID from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              description: 'Post slug (URL-friendly name)',
            },
            id: {
              type: 'number',
              description: 'Post ID',
            },
          },
        },
      },
      {
        name: 'get_categories',
        description: 'Fetch all categories from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: {
              type: 'number',
              description: 'Categories per page (default: 100)',
            },
          },
        },
      },
      {
        name: 'get_tags',
        description: 'Fetch all tags from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: {
              type: 'number',
              description: 'Tags per page (default: 100)',
            },
          },
        },
      },
      {
        name: 'get_media',
        description: 'Fetch media items (images) from cursedtours.com',
        inputSchema: {
          type: 'object',
          properties: {
            per_page: {
              type: 'number',
              description: 'Media items per page (default: 10)',
            },
            search: {
              type: 'string',
              description: 'Search term for media',
            },
          },
        },
      },
      {
        name: 'get_site_info',
        description: 'Get basic site information from cursedtours.com',
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
          orderby: args?.orderby || 'date',
          order: args?.order || 'desc',
          _embed: true,
        });

        const posts = data.map((post) => ({
          id: post.id,
          title: stripHtml(post.title?.rendered),
          slug: post.slug,
          date: post.date,
          excerpt: stripHtml(post.excerpt?.rendered).slice(0, 200),
          link: post.link,
          categories: post._embedded?.['wp:term']?.[0]?.map((c) => c.name) || [],
          featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          author: post._embedded?.author?.[0]?.name || 'Unknown',
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ posts, totalPages, total }, null, 2),
            },
          ],
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
          return {
            content: [{ type: 'text', text: 'Post not found' }],
          };
        }

        const result = {
          id: post.id,
          title: stripHtml(post.title?.rendered),
          slug: post.slug,
          date: post.date,
          modified: post.modified,
          content: stripHtml(post.content?.rendered).slice(0, 2000),
          excerpt: stripHtml(post.excerpt?.rendered),
          link: post.link,
          categories: post._embedded?.['wp:term']?.[0]?.map((c) => ({ id: c.id, name: c.name, slug: c.slug })) || [],
          tags: post._embedded?.['wp:term']?.[1]?.map((t) => ({ id: t.id, name: t.name, slug: t.slug })) || [],
          featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
          author: post._embedded?.author?.[0]?.name || 'Unknown',
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_categories': {
        const { data } = await fetchWP('/categories', {
          per_page: args?.per_page || 100,
          orderby: 'count',
          order: 'desc',
        });

        const categories = data.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat.count,
          description: cat.description,
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(categories, null, 2) }],
        };
      }

      case 'get_tags': {
        const { data } = await fetchWP('/tags', {
          per_page: args?.per_page || 100,
          orderby: 'count',
          order: 'desc',
        });

        const tags = data.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          count: tag.count,
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(tags, null, 2) }],
        };
      }

      case 'get_media': {
        const { data } = await fetchWP('/media', {
          per_page: args?.per_page || 10,
          search: args?.search,
        });

        const media = data.map((item) => ({
          id: item.id,
          title: stripHtml(item.title?.rendered),
          url: item.source_url,
          alt: item.alt_text,
          width: item.media_details?.width,
          height: item.media_details?.height,
          sizes: item.media_details?.sizes ? Object.keys(item.media_details.sizes) : [],
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(media, null, 2) }],
        };
      }

      case 'get_site_info': {
        const response = await fetch(`${WP_BASE_URL}/wp-json`);
        const data = await response.json();

        const info = {
          name: data.name,
          description: data.description,
          url: data.url,
          home: data.home,
          gmt_offset: data.gmt_offset,
          timezone_string: data.timezone_string,
          namespaces: data.namespaces?.slice(0, 10),
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(info, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
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
