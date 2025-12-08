#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Base URL for the Replit products API - set via environment variable
const PRODUCTS_API_URL = process.env.PRODUCTS_API_URL || 'https://your-replit-url.repl.co';

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
        description: 'Fetch haunted/paranormal tour products from the Cursed Tours database. Returns a paginated list of tours with details like title, price, rating, location, and booking URL.',
        inputSchema: {
          type: 'object',
          properties: {
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
        description: 'Fetch a single haunted tour product by its unique database ID',
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
        description: 'Fetch a single haunted tour product by its Viator product code',
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
        description: 'Get statistics about the haunted tours niche including total product count and last sync information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // Health Check
      {
        name: 'health_check',
        description: 'Check if the Cursed Tours products API is healthy and responding',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // Search Products by Destination
      {
        name: 'search_by_destination',
        description: 'Search for haunted tours in a specific destination/city. Fetches all products and filters by destination name.',
        inputSchema: {
          type: 'object',
          properties: {
            destination: {
              type: 'string',
              description: 'City or destination name to search for (e.g., "New Orleans", "Salem", "London")',
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
        description: 'Get the highest-rated haunted tours. Fetches products and sorts by rating.',
        inputSchema: {
          type: 'object',
          properties: {
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
        description: 'Find affordable haunted tours under a specified price',
        inputSchema: {
          type: 'object',
          properties: {
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
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_products': {
        const data = await fetchAPI('/api/niches/haunted/products', {
          limit: args?.limit || 50,
          offset: args?.offset || 0,
        });

        const result = {
          niche: data.niche,
          total: data.total,
          limit: data.limit,
          offset: data.offset,
          products: data.products.map((p) => ({
            id: p.id,
            productCode: p.productCode,
            title: p.title,
            description: p.description?.slice(0, 300) + (p.description?.length > 300 ? '...' : ''),
            price: formatPrice(p.priceFrom, p.currencyCode),
            priceValue: p.priceFrom,
            destination: p.destinationName,
            rating: p.rating,
            reviewCount: p.reviewCount,
            duration: formatDuration(p.durationMinutes),
            durationMinutes: p.durationMinutes,
            imageUrl: p.primaryImageUrl,
            bookingUrl: p.viatorUrl,
            instantConfirmation: p.confirmationType === 'INSTANT',
            freeCancellation: p.freeCancellation,
            isActive: p.isActive,
          })),
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

        const result = {
          id: product.id,
          productCode: product.productCode,
          title: product.title,
          description: product.description,
          shortDescription: product.shortDescription,
          price: formatPrice(product.priceFrom, product.currencyCode),
          priceValue: product.priceFrom,
          originalPrice: product.priceBeforeDiscount ? formatPrice(product.priceBeforeDiscount, product.currencyCode) : null,
          currency: product.currencyCode,
          destination: product.destinationName,
          destinationId: product.destinationId,
          rating: product.rating,
          reviewCount: product.reviewCount,
          duration: formatDuration(product.durationMinutes),
          durationMinutes: product.durationMinutes,
          durationText: product.durationText,
          imageUrl: product.primaryImageUrl,
          bookingUrl: product.viatorUrl,
          confirmationType: product.confirmationType,
          instantConfirmation: product.confirmationType === 'INSTANT',
          freeCancellation: product.freeCancellation,
          tags: product.tags,
          isActive: product.isActive,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_product_by_code': {
        if (!args?.productCode) {
          throw new Error('Product code is required');
        }

        const product = await fetchAPI(`/api/products/code/${args.productCode}`);

        const result = {
          id: product.id,
          productCode: product.productCode,
          title: product.title,
          description: product.description,
          shortDescription: product.shortDescription,
          price: formatPrice(product.priceFrom, product.currencyCode),
          priceValue: product.priceFrom,
          originalPrice: product.priceBeforeDiscount ? formatPrice(product.priceBeforeDiscount, product.currencyCode) : null,
          currency: product.currencyCode,
          destination: product.destinationName,
          destinationId: product.destinationId,
          rating: product.rating,
          reviewCount: product.reviewCount,
          duration: formatDuration(product.durationMinutes),
          durationMinutes: product.durationMinutes,
          durationText: product.durationText,
          imageUrl: product.primaryImageUrl,
          bookingUrl: product.viatorUrl,
          confirmationType: product.confirmationType,
          instantConfirmation: product.confirmationType === 'INSTANT',
          freeCancellation: product.freeCancellation,
          tags: product.tags,
          isActive: product.isActive,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'get_niche_stats': {
        const data = await fetchAPI('/api/niches/haunted');

        const result = {
          niche: data.niche,
          productCount: data.productCount,
          lastSync: data.lastSync,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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

        // Fetch products and filter by destination
        const data = await fetchAPI('/api/niches/haunted/products', {
          limit: 100, // Fetch more to filter
          offset: 0,
        });

        const matchingProducts = data.products
          .filter((p) => p.destinationName?.toLowerCase().includes(searchTerm))
          .slice(0, limit)
          .map((p) => ({
            id: p.id,
            productCode: p.productCode,
            title: p.title,
            description: p.description?.slice(0, 200) + (p.description?.length > 200 ? '...' : ''),
            price: formatPrice(p.priceFrom, p.currencyCode),
            priceValue: p.priceFrom,
            destination: p.destinationName,
            rating: p.rating,
            reviewCount: p.reviewCount,
            duration: formatDuration(p.durationMinutes),
            bookingUrl: p.viatorUrl,
            freeCancellation: p.freeCancellation,
          }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              searchedDestination: args.destination,
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

        // Fetch products and filter/sort by rating
        const data = await fetchAPI('/api/niches/haunted/products', {
          limit: 100,
          offset: 0,
        });

        const topRated = data.products
          .filter((p) => p.rating >= minRating && p.reviewCount >= minReviews && p.isActive)
          .sort((a, b) => {
            // Sort by rating first, then by review count
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.reviewCount - a.reviewCount;
          })
          .slice(0, limit)
          .map((p) => ({
            id: p.id,
            productCode: p.productCode,
            title: p.title,
            destination: p.destinationName,
            rating: p.rating,
            reviewCount: p.reviewCount,
            price: formatPrice(p.priceFrom, p.currencyCode),
            priceValue: p.priceFrom,
            duration: formatDuration(p.durationMinutes),
            bookingUrl: p.viatorUrl,
            freeCancellation: p.freeCancellation,
          }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              criteria: { minRating, minReviews },
              matchCount: topRated.length,
              products: topRated,
            }, null, 2),
          }],
        };
      }

      case 'get_budget_tours': {
        const maxPrice = args?.maxPrice || 30;
        const limit = args?.limit || 20;

        // Fetch products and filter by price
        const data = await fetchAPI('/api/niches/haunted/products', {
          limit: 100,
          offset: 0,
        });

        const budgetTours = data.products
          .filter((p) => p.priceFrom && p.priceFrom <= maxPrice && p.isActive)
          .sort((a, b) => a.priceFrom - b.priceFrom)
          .slice(0, limit)
          .map((p) => ({
            id: p.id,
            productCode: p.productCode,
            title: p.title,
            destination: p.destinationName,
            price: formatPrice(p.priceFrom, p.currencyCode),
            priceValue: p.priceFrom,
            rating: p.rating,
            reviewCount: p.reviewCount,
            duration: formatDuration(p.durationMinutes),
            bookingUrl: p.viatorUrl,
            freeCancellation: p.freeCancellation,
          }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              criteria: { maxPrice: `$${maxPrice}` },
              matchCount: budgetTours.length,
              products: budgetTours,
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
}

main().catch(console.error);
