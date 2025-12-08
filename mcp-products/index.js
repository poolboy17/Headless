#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Base URL for the Replit products API
const PRODUCTS_API_URL = process.env.PRODUCTS_API_URL || 'https://viator-haunts--genaromvasquez.replit.app';

// Available niches
const NICHES = ['haunted', 'culinary'];

// Helper function to fetch from Products API
async function fetchAPI(endpoint, params = {}) {
  const url = new URL(`${PRODUCTS_API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Products API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Format price for display
function formatPrice(price, currency = 'USD') {
  if (!price) return 'Price not available';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

// Format duration for display
function formatDuration(minutes) {
  if (!minutes) return 'Duration not specified';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
}

// Format product for response
function formatProduct(p, verbose = false) {
  const base = {
    id: p.id,
    productCode: p.productCode,
    title: p.title,
    price: formatPrice(p.priceFrom, p.currencyCode),
    priceValue: p.priceFrom,
    destination: p.destinationName,
    rating: p.rating,
    reviewCount: p.reviewCount,
    duration: formatDuration(p.durationMinutes),
    bookingUrl: p.viatorUrl,
    freeCancellation: p.freeCancellation,
    isActive: p.isActive,
  };

  if (verbose) {
    return {
      ...base,
      description: p.description,
      shortDescription: p.shortDescription,
      originalPrice: p.priceBeforeDiscount ? formatPrice(p.priceBeforeDiscount, p.currencyCode) : null,
      currency: p.currencyCode,
      destinationId: p.destinationId,
      durationMinutes: p.durationMinutes,
      durationText: p.durationText,
      imageUrl: p.primaryImageUrl,
      confirmationType: p.confirmationType,
      instantConfirmation: p.confirmationType === 'INSTANT',
      tags: p.tags,
    };
  }

  return {
    ...base,
    description: p.description?.slice(0, 300) + (p.description?.length > 300 ? '...' : ''),
    imageUrl: p.primaryImageUrl,
    instantConfirmation: p.confirmationType === 'INSTANT',
  };
}

// Create the MCP server
const server = new Server(
  {
    name: 'cursedtours-products',
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
      // Get Products with Pagination
      {
        name: 'get_products',
        description: 'Fetch tour products from the database. Supports haunted/paranormal tours and culinary tours. Returns a paginated list with title, price, rating, location, and booking URL.',
        inputSchema: {
          type: 'object',
          properties: {
            niche: {
              type: 'string',
              enum: NICHES,
              description: 'Tour category: "haunted" for ghost/paranormal tours, "culinary" for food tours (default: haunted)',
            },
            limit: {
              type: 'number',
              description: 'Number of products per page (default: 50, max: 100)',
            },
            offset: {
              type: 'number',
              description: 'Number of products to skip for pagination (default: 0)',
            },
          },
        },
      },
      // Get Single Product by ID
      {
        name: 'get_product_by_id',
        description: 'Fetch a single tour product by its unique database ID with full details',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The unique database ID of the product',
            },
          },
          required: ['id'],
        },
      },
      // Get Product by Viator Code
      {
        name: 'get_product_by_code',
        description: 'Fetch a single tour product by its Viator product code with full details',
        inputSchema: {
          type: 'object',
          properties: {
            productCode: {
              type: 'string',
              description: 'The Viator product code (e.g., "12345P1")',
            },
          },
          required: ['productCode'],
        },
      },
      // Get Niche Statistics
      {
        name: 'get_niche_stats',
        description: 'Get statistics about a tour niche including total product count and last sync information',
        inputSchema: {
          type: 'object',
          properties: {
            niche: {
              type: 'string',
              enum: NICHES,
              description: 'Tour category: "haunted" or "culinary" (default: haunted)',
            },
          },
        },
      },
      // List All Niches
      {
        name: 'list_niches',
        description: 'Get statistics for all available tour niches (haunted and culinary)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // Health Check
      {
        name: 'health_check',
        description: 'Check if the products API is healthy and responding',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // Search Products by Destination
      {
        name: 'search_by_destination',
        description: 'Search for tours in a specific destination/city across one or all niches',
        inputSchema: {
          type: 'object',
          properties: {
            destination: {
              type: 'string',
              description: 'City or destination name to search for (e.g., "New Orleans", "Salem", "Paris")',
            },
            niche: {
              type: 'string',
              enum: [...NICHES, 'all'],
              description: 'Tour category: "haunted", "culinary", or "all" (default: all)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 20)',
            },
          },
          required: ['destination'],
        },
      },
      // Get Top Rated Tours
      {
        name: 'get_top_rated',
        description: 'Get the highest-rated tours, sorted by rating and review count',
        inputSchema: {
          type: 'object',
          properties: {
            niche: {
              type: 'string',
              enum: [...NICHES, 'all'],
              description: 'Tour category: "haunted", "culinary", or "all" (default: haunted)',
            },
            minRating: {
              type: 'number',
              description: 'Minimum rating to include (default: 4.5)',
            },
            minReviews: {
              type: 'number',
              description: 'Minimum number of reviews required (default: 50)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 20)',
            },
          },
        },
      },
      // Get Budget-Friendly Tours
      {
        name: 'get_budget_tours',
        description: 'Find affordable tours under a specified price',
        inputSchema: {
          type: 'object',
          properties: {
            niche: {
              type: 'string',
              enum: [...NICHES, 'all'],
              description: 'Tour category: "haunted", "culinary", or "all" (default: haunted)',
            },
            maxPrice: {
              type: 'number',
              description: 'Maximum price in USD (default: 30)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 20)',
            },
          },
        },
      },
      // Search by Keyword
      {
        name: 'search_tours',
        description: 'Search tours by keyword in title or description',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search keyword (e.g., "vampire", "cemetery", "wine tasting")',
            },
            niche: {
              type: 'string',
              enum: [...NICHES, 'all'],
              description: 'Tour category: "haunted", "culinary", or "all" (default: all)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 20)',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

// Helper to fetch products from multiple niches
async function fetchProductsFromNiches(niches, limit = 100) {
  const results = [];
  for (const niche of niches) {
    try {
      const data = await fetchAPI(`/api/niches/${niche}/products`, { limit, offset: 0 });
      results.push(...data.products.map((p) => ({ ...p, niche })));
    } catch (e) {
      console.error(`Error fetching ${niche}:`, e.message);
    }
  }
  return results;
}

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_products': {
        const niche = args?.niche || 'haunted';
        const data = await fetchAPI(`/api/niches/${niche}/products`, {
          limit: args?.limit || 50,
          offset: args?.offset || 0,
        });

        const result = {
          niche: data.niche,
          total: data.total,
          limit: data.limit,
          offset: data.offset,
          products: data.products.map((p) => formatProduct(p)),
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_product_by_id': {
        if (!args?.id) {
          throw new Error('Product ID is required');
        }

        const product = await fetchAPI(`/api/products/${args.id}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(formatProduct(product, true), null, 2) }],
        };
      }

      case 'get_product_by_code': {
        if (!args?.productCode) {
          throw new Error('Product code is required');
        }

        const product = await fetchAPI(`/api/products/code/${args.productCode}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(formatProduct(product, true), null, 2) }],
        };
      }

      case 'get_niche_stats': {
        const niche = args?.niche || 'haunted';
        const data = await fetchAPI(`/api/niches/${niche}`);

        return {
          content: [{ type: 'text', text: JSON.stringify({
            niche: data.niche,
            productCount: data.productCount,
            lastSync: data.lastSync,
          }, null, 2) }],
        };
      }

      case 'list_niches': {
        const nicheStats = [];
        for (const niche of NICHES) {
          try {
            const data = await fetchAPI(`/api/niches/${niche}`);
            nicheStats.push({
              niche: data.niche,
              productCount: data.productCount,
              lastSync: data.lastSync,
            });
          } catch (e) {
            nicheStats.push({ niche: { key: niche }, error: e.message });
          }
        }

        return {
          content: [{ type: 'text', text: JSON.stringify({ niches: nicheStats }, null, 2) }],
        };
      }

      case 'health_check': {
        const data = await fetchAPI('/api/health');
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }

      case 'search_by_destination': {
        if (!args?.destination) {
          throw new Error('Destination is required');
        }

        const limit = args?.limit || 20;
        const searchTerm = args.destination.toLowerCase();
        const nicheFilter = args?.niche || 'all';
        const nichesToSearch = nicheFilter === 'all' ? NICHES : [nicheFilter];

        const allProducts = await fetchProductsFromNiches(nichesToSearch, 100);

        const matchingProducts = allProducts
          .filter((p) => p.destinationName?.toLowerCase().includes(searchTerm))
          .slice(0, limit)
          .map((p) => ({
            ...formatProduct(p),
            niche: p.niche,
          }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              searchedDestination: args.destination,
              nichesSearched: nichesToSearch,
              matchCount: matchingProducts.length,
              products: matchingProducts,
            }, null, 2),
          }],
        };
      }

      case 'get_top_rated': {
        const minRating = args?.minRating || 4.5;
        const minReviews = args?.minReviews || 50;
        const limit = args?.limit || 20;
        const nicheFilter = args?.niche || 'haunted';
        const nichesToSearch = nicheFilter === 'all' ? NICHES : [nicheFilter];

        const allProducts = await fetchProductsFromNiches(nichesToSearch, 100);

        const topRated = allProducts
          .filter((p) => p.rating >= minRating && p.reviewCount >= minReviews && p.isActive)
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.reviewCount - a.reviewCount;
          })
          .slice(0, limit)
          .map((p) => ({
            ...formatProduct(p),
            niche: p.niche,
          }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              criteria: { minRating, minReviews },
              nichesSearched: nichesToSearch,
              matchCount: topRated.length,
              products: topRated,
            }, null, 2),
          }],
        };
      }

      case 'get_budget_tours': {
        const maxPrice = args?.maxPrice || 30;
        const limit = args?.limit || 20;
        const nicheFilter = args?.niche || 'haunted';
        const nichesToSearch = nicheFilter === 'all' ? NICHES : [nicheFilter];

        const allProducts = await fetchProductsFromNiches(nichesToSearch, 100);

        const budgetTours = allProducts
          .filter((p) => p.priceFrom && p.priceFrom <= maxPrice && p.isActive)
          .sort((a, b) => a.priceFrom - b.priceFrom)
          .slice(0, limit)
          .map((p) => ({
            ...formatProduct(p),
            niche: p.niche,
          }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              criteria: { maxPrice: `$${maxPrice}` },
              nichesSearched: nichesToSearch,
              matchCount: budgetTours.length,
              products: budgetTours,
            }, null, 2),
          }],
        };
      }

      case 'search_tours': {
        if (!args?.query) {
          throw new Error('Search query is required');
        }

        const limit = args?.limit || 20;
        const searchTerm = args.query.toLowerCase();
        const nicheFilter = args?.niche || 'all';
        const nichesToSearch = nicheFilter === 'all' ? NICHES : [nicheFilter];

        const allProducts = await fetchProductsFromNiches(nichesToSearch, 100);

        const matchingProducts = allProducts
          .filter((p) =>
            p.title?.toLowerCase().includes(searchTerm) ||
            p.description?.toLowerCase().includes(searchTerm)
          )
          .slice(0, limit)
          .map((p) => ({
            ...formatProduct(p),
            niche: p.niche,
          }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              query: args.query,
              nichesSearched: nichesToSearch,
              matchCount: matchingProducts.length,
              products: matchingProducts,
            }, null, 2),
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
  console.error('Cursed Tours Products MCP server running');
  console.error(`API URL: ${PRODUCTS_API_URL}`);
  console.error(`Available niches: ${NICHES.join(', ')}`);
}

main().catch(console.error);
