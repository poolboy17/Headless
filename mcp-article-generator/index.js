#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Configuration
const PRODUCTS_API_URL = process.env.PRODUCTS_API_URL || 'https://viator-haunts--genaromvasquez.replit.app';
const WORDPRESS_URL = process.env.WORDPRESS_URL || 'https://wp.cursedtours.com';
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Article templates for different content types
const ARTICLE_TEMPLATES = {
  showcase: {
    name: 'Product Showcase',
    description: 'Detailed tour showcase with atmosphere and highlights',
    prompt: `You are a writer for Cursed Tours, a paranormal investigation and ghost tour blog.
Your tone is intriguing, atmospheric, and respectful of the supernatural.
Write engaging, SEO-friendly content that captures the mystery and history of haunted locations.
Do not use emojis. Use WordPress Gutenberg block format.

Create a comprehensive showcase article for this tour:

TOUR: {title}
LOCATION: {destination}
PRICE: {price}
DURATION: {duration}
RATING: {rating} ({reviewCount} reviews)
DESCRIPTION: {description}

Write an engaging article (600-800 words) that includes:
1. An atmospheric introduction that sets the scene
2. What makes this tour unique and compelling
3. Historical and paranormal significance of the locations
4. What visitors can expect during the experience
5. Practical details (duration, what's included)
6. A compelling call to action

Format everything as WordPress Gutenberg blocks (wp:paragraph, wp:heading h2/h3, wp:list, wp:quote).
Include a suggested meta description (150-160 chars) at the end in a comment block.`,
  },
  destination: {
    name: 'Destination Guide',
    description: 'Multi-tour destination guide for a city',
    prompt: `You are a writer for Cursed Tours, creating destination guides for paranormal tourism.
Your tone is intriguing, informative, and captures the supernatural essence of each city.
Do not use emojis. Use WordPress Gutenberg block format.

Create a destination guide for haunted tours in this city:

DESTINATION: {destination}
NUMBER OF TOURS: {tourCount}

FEATURED TOURS:
{tourList}

Write an engaging destination guide (800-1000 words) that includes:
1. Introduction to the city's haunted history and paranormal reputation
2. Why this destination is perfect for ghost tour enthusiasts
3. Overview of the different tour experiences available
4. Best times to visit and what to expect
5. Tips for paranormal enthusiasts
6. Compelling conclusion encouraging booking

Format as WordPress Gutenberg blocks. Include suggested meta description at the end.`,
  },
  roundup: {
    name: 'Top Tours Roundup',
    description: 'Best-of list with multiple tours',
    prompt: `You are a writer for Cursed Tours, creating curated roundup articles.
Your tone is authoritative, helpful, and captures the excitement of paranormal tourism.
Do not use emojis. Use WordPress Gutenberg block format.

Create a roundup article featuring these top-rated tours:

THEME: {theme}

TOURS TO FEATURE:
{tourList}

Write an engaging roundup article (700-900 words) that includes:
1. Introduction explaining the selection criteria
2. Individual sections for each tour with:
   - Tour name and location
   - What makes it special
   - Key highlights
   - Rating and price info
3. Conclusion with recommendations for different types of visitors

Format as WordPress Gutenberg blocks with h2 for each tour section.
Include suggested meta description at the end.`,
  },
};

// Helper: Fetch from Products API
async function fetchProducts(endpoint, params = {}) {
  const url = new URL(`${PRODUCTS_API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Products API error: ${response.status}`);
  }
  return response.json();
}

// Helper: Generate content with Ollama
async function generateWithOllama(prompt) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama generation failed:', error.message);
    return null;
  }
}

// Helper: Generate content with OpenAI
async function generateWithOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional content writer for a paranormal tourism website.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content;
  } catch (error) {
    console.error('OpenAI generation failed:', error.message);
    return null;
  }
}

// Helper: Generate content (tries Ollama first, falls back to OpenAI)
async function generateContent(prompt) {
  // Try Ollama first (local)
  let content = await generateWithOllama(prompt);

  if (content) {
    console.error('Generated content using Ollama');
    return { content, provider: 'ollama' };
  }

  // Fall back to OpenAI
  content = await generateWithOpenAI(prompt);

  if (content) {
    console.error('Generated content using OpenAI');
    return { content, provider: 'openai' };
  }

  throw new Error('No AI provider available. Ensure Ollama is running or OPENAI_API_KEY is set.');
}

// Helper: Create WordPress post
async function createWordPressPost(postData) {
  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    throw new Error('WordPress credentials not configured (WP_USERNAME, WP_APP_PASSWORD)');
  }

  const credentials = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

  const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WordPress error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Helper: Upload image to WordPress from URL
async function uploadImageToWordPress(imageUrl, title) {
  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    return null;
  }

  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return null;

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : 'jpg';
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${extension}`;

    const credentials = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

    const response = await fetch(`${WORDPRESS_URL}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: Buffer.from(imageBuffer),
    });

    if (!response.ok) return null;

    const media = await response.json();
    return media.id;
  } catch (error) {
    console.error('Image upload failed:', error.message);
    return null;
  }
}

// Helper: Format price
function formatPrice(price, currency = 'USD') {
  if (!price) return 'Price varies';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

// Helper: Format duration
function formatDuration(minutes) {
  if (!minutes) return 'Duration varies';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
}

// Helper: Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// Create the MCP server
const server = new Server(
  {
    name: 'cursedtours-article-generator',
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
        name: 'generate_tour_article',
        description: 'Generate a showcase article for a specific tour product using AI (Ollama/OpenAI)',
        inputSchema: {
          type: 'object',
          properties: {
            productCode: {
              type: 'string',
              description: 'Viator product code (e.g., "12345P1")',
            },
            productId: {
              type: 'string',
              description: 'Database product ID (alternative to productCode)',
            },
            publish: {
              type: 'boolean',
              description: 'Publish to WordPress immediately (default: false, creates as draft)',
            },
          },
        },
      },
      {
        name: 'generate_destination_guide',
        description: 'Generate a destination guide article featuring multiple tours in a city',
        inputSchema: {
          type: 'object',
          properties: {
            destination: {
              type: 'string',
              description: 'City/destination name (e.g., "New Orleans", "Salem")',
            },
            niche: {
              type: 'string',
              enum: ['haunted', 'culinary', 'all'],
              description: 'Tour category (default: haunted)',
            },
            maxTours: {
              type: 'number',
              description: 'Maximum tours to include (default: 5)',
            },
            publish: {
              type: 'boolean',
              description: 'Publish to WordPress immediately (default: false)',
            },
          },
          required: ['destination'],
        },
      },
      {
        name: 'generate_roundup_article',
        description: 'Generate a "best of" roundup article featuring top-rated tours',
        inputSchema: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              description: 'Theme for the roundup (e.g., "Top Ghost Tours", "Best Cemetery Tours")',
            },
            niche: {
              type: 'string',
              enum: ['haunted', 'culinary', 'all'],
              description: 'Tour category (default: haunted)',
            },
            destination: {
              type: 'string',
              description: 'Optional: limit to specific destination',
            },
            count: {
              type: 'number',
              description: 'Number of tours to include (default: 5)',
            },
            minRating: {
              type: 'number',
              description: 'Minimum rating (default: 4.5)',
            },
            publish: {
              type: 'boolean',
              description: 'Publish to WordPress immediately (default: false)',
            },
          },
          required: ['theme'],
        },
      },
      {
        name: 'preview_article',
        description: 'Preview generated article content without publishing',
        inputSchema: {
          type: 'object',
          properties: {
            productCode: {
              type: 'string',
              description: 'Viator product code for single tour preview',
            },
            template: {
              type: 'string',
              enum: ['showcase', 'destination', 'roundup'],
              description: 'Article template type (default: showcase)',
            },
          },
        },
      },
      {
        name: 'list_templates',
        description: 'List available article templates and their descriptions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'check_ai_status',
        description: 'Check which AI providers are available (Ollama, OpenAI)',
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
      case 'generate_tour_article': {
        // Fetch product data
        let product;
        if (args?.productCode) {
          product = await fetchProducts(`/api/products/code/${args.productCode}`);
        } else if (args?.productId) {
          product = await fetchProducts(`/api/products/${args.productId}`);
        } else {
          throw new Error('Either productCode or productId is required');
        }

        // Build prompt with product data
        const template = ARTICLE_TEMPLATES.showcase;
        const prompt = template.prompt
          .replace('{title}', product.title)
          .replace('{destination}', product.destinationName || 'Unknown')
          .replace('{price}', formatPrice(product.priceFrom, product.currencyCode))
          .replace('{duration}', formatDuration(product.durationMinutes))
          .replace('{rating}', product.rating || 'N/A')
          .replace('{reviewCount}', product.reviewCount || 0)
          .replace('{description}', product.description || '');

        // Generate content
        const { content, provider } = await generateContent(prompt);

        // Create post data
        const postData = {
          title: product.title,
          content: content,
          status: args?.publish ? 'publish' : 'draft',
          slug: generateSlug(product.title),
          meta: {
            product_code: product.productCode,
            viator_url: product.viatorUrl,
            tour_price: product.priceFrom,
            tour_duration: product.durationMinutes,
          },
        };

        // Upload featured image if available
        if (product.primaryImageUrl) {
          const mediaId = await uploadImageToWordPress(product.primaryImageUrl, product.title);
          if (mediaId) {
            postData.featured_media = mediaId;
          }
        }

        // Create WordPress post
        const post = await createWordPressPost(postData);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Article ${args?.publish ? 'published' : 'saved as draft'}`,
              post: {
                id: post.id,
                title: post.title.rendered,
                slug: post.slug,
                link: post.link,
                status: post.status,
              },
              product: {
                code: product.productCode,
                title: product.title,
                destination: product.destinationName,
              },
              ai: { provider },
            }, null, 2),
          }],
        };
      }

      case 'generate_destination_guide': {
        const destination = args?.destination;
        const niche = args?.niche || 'haunted';
        const maxTours = args?.maxTours || 5;

        // Fetch tours for this destination
        const data = await fetchProducts(`/api/niches/${niche}/products`, { limit: 100 });
        const tours = data.products
          .filter(p => p.destinationName?.toLowerCase().includes(destination.toLowerCase()) && p.isActive)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, maxTours);

        if (tours.length === 0) {
          throw new Error(`No tours found for destination: ${destination}`);
        }

        // Build tour list for prompt
        const tourList = tours.map((t, i) =>
          `${i + 1}. ${t.title}\n   Rating: ${t.rating || 'N/A'} | Price: ${formatPrice(t.priceFrom)} | Duration: ${formatDuration(t.durationMinutes)}\n   ${t.description?.slice(0, 200)}...`
        ).join('\n\n');

        // Build prompt
        const template = ARTICLE_TEMPLATES.destination;
        const prompt = template.prompt
          .replace('{destination}', destination)
          .replace('{tourCount}', tours.length)
          .replace('{tourList}', tourList);

        // Generate content
        const { content, provider } = await generateContent(prompt);

        // Create post
        const postData = {
          title: `Haunted ${destination}: Your Guide to Ghost Tours & Paranormal Experiences`,
          content: content,
          status: args?.publish ? 'publish' : 'draft',
          slug: generateSlug(`haunted-${destination}-ghost-tours-guide`),
        };

        // Use first tour's image as featured image
        if (tours[0]?.primaryImageUrl) {
          const mediaId = await uploadImageToWordPress(tours[0].primaryImageUrl, `haunted-${destination}`);
          if (mediaId) {
            postData.featured_media = mediaId;
          }
        }

        const post = await createWordPressPost(postData);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Destination guide ${args?.publish ? 'published' : 'saved as draft'}`,
              post: {
                id: post.id,
                title: post.title.rendered,
                link: post.link,
                status: post.status,
              },
              destination: destination,
              toursIncluded: tours.map(t => ({ title: t.title, rating: t.rating })),
              ai: { provider },
            }, null, 2),
          }],
        };
      }

      case 'generate_roundup_article': {
        const theme = args?.theme;
        const niche = args?.niche || 'haunted';
        const count = args?.count || 5;
        const minRating = args?.minRating || 4.5;

        // Fetch top-rated tours
        const data = await fetchProducts(`/api/niches/${niche}/products`, { limit: 100 });
        let tours = data.products
          .filter(p => p.rating >= minRating && p.isActive && p.reviewCount >= 50);

        // Filter by destination if specified
        if (args?.destination) {
          tours = tours.filter(p =>
            p.destinationName?.toLowerCase().includes(args.destination.toLowerCase())
          );
        }

        tours = tours
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, count);

        if (tours.length === 0) {
          throw new Error('No tours match the criteria');
        }

        // Build tour list
        const tourList = tours.map((t, i) =>
          `${i + 1}. ${t.title} (${t.destinationName})\n   Rating: ${t.rating} (${t.reviewCount} reviews) | Price: ${formatPrice(t.priceFrom)} | Duration: ${formatDuration(t.durationMinutes)}\n   ${t.description?.slice(0, 300)}...`
        ).join('\n\n');

        // Build prompt
        const template = ARTICLE_TEMPLATES.roundup;
        const prompt = template.prompt
          .replace('{theme}', theme)
          .replace('{tourList}', tourList);

        // Generate content
        const { content, provider } = await generateContent(prompt);

        // Create post
        const postData = {
          title: theme,
          content: content,
          status: args?.publish ? 'publish' : 'draft',
          slug: generateSlug(theme),
        };

        // Use first tour's image
        if (tours[0]?.primaryImageUrl) {
          const mediaId = await uploadImageToWordPress(tours[0].primaryImageUrl, theme);
          if (mediaId) {
            postData.featured_media = mediaId;
          }
        }

        const post = await createWordPressPost(postData);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Roundup article ${args?.publish ? 'published' : 'saved as draft'}`,
              post: {
                id: post.id,
                title: post.title.rendered,
                link: post.link,
                status: post.status,
              },
              theme: theme,
              toursIncluded: tours.map(t => ({
                title: t.title,
                destination: t.destinationName,
                rating: t.rating
              })),
              ai: { provider },
            }, null, 2),
          }],
        };
      }

      case 'preview_article': {
        let product;
        if (args?.productCode) {
          product = await fetchProducts(`/api/products/code/${args.productCode}`);
        } else {
          // Get a sample product
          const data = await fetchProducts('/api/niches/haunted/products', { limit: 1 });
          product = data.products[0];
        }

        const template = ARTICLE_TEMPLATES[args?.template || 'showcase'];
        const prompt = template.prompt
          .replace('{title}', product.title)
          .replace('{destination}', product.destinationName || 'Unknown')
          .replace('{price}', formatPrice(product.priceFrom, product.currencyCode))
          .replace('{duration}', formatDuration(product.durationMinutes))
          .replace('{rating}', product.rating || 'N/A')
          .replace('{reviewCount}', product.reviewCount || 0)
          .replace('{description}', product.description || '');

        const { content, provider } = await generateContent(prompt);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              preview: true,
              product: {
                code: product.productCode,
                title: product.title,
                destination: product.destinationName,
                image: product.primaryImageUrl,
              },
              generatedContent: content,
              ai: { provider },
            }, null, 2),
          }],
        };
      }

      case 'list_templates': {
        const templates = Object.entries(ARTICLE_TEMPLATES).map(([key, t]) => ({
          id: key,
          name: t.name,
          description: t.description,
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ templates }, null, 2),
          }],
        };
      }

      case 'check_ai_status': {
        const status = {
          ollama: { available: false, url: OLLAMA_URL, model: OLLAMA_MODEL },
          openai: { available: !!OPENAI_API_KEY, configured: !!OPENAI_API_KEY },
          wordpress: {
            url: WORDPRESS_URL,
            authenticated: !!(WP_USERNAME && WP_APP_PASSWORD),
          },
          productsApi: { url: PRODUCTS_API_URL },
        };

        // Check Ollama
        try {
          const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            signal: AbortSignal.timeout(3000)
          });
          if (response.ok) {
            const data = await response.json();
            status.ollama.available = true;
            status.ollama.models = data.models?.map(m => m.name) || [];
          }
        } catch {
          status.ollama.error = 'Not running or unreachable';
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(status, null, 2),
          }],
        };
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
  console.error('Article Generator MCP server running');
  console.error(`Products API: ${PRODUCTS_API_URL}`);
  console.error(`WordPress: ${WORDPRESS_URL}`);
  console.error(`Ollama: ${OLLAMA_URL} (model: ${OLLAMA_MODEL})`);
  console.error(`OpenAI: ${OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
}

main().catch(console.error);
