#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional

if (!VERCEL_TOKEN) {
  console.error('Warning: VERCEL_TOKEN environment variable not set');
}

// Helper function to fetch from Vercel API
async function fetchVercel(endpoint, options = {}) {
  const url = new URL(`${VERCEL_API_URL}${endpoint}`);

  // Add team ID if specified
  if (VERCEL_TEAM_ID) {
    url.searchParams.append('teamId', VERCEL_TEAM_ID);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Create the MCP server
const server = new Server(
  {
    name: 'vercel',
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
      // User/Account
      {
        name: 'get_user',
        description: 'Get current Vercel user information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      // Projects
      {
        name: 'list_projects',
        description: 'List all Vercel projects',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of projects to return (default: 20)' },
            search: { type: 'string', description: 'Search projects by name' },
          },
        },
      },
      {
        name: 'get_project',
        description: 'Get details of a specific Vercel project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID or name (required)' },
          },
          required: ['projectId'],
        },
      },
      // Deployments
      {
        name: 'list_deployments',
        description: 'List deployments for a project or all projects',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Filter by project ID or name' },
            limit: { type: 'number', description: 'Number of deployments to return (default: 10)' },
            state: { type: 'string', description: 'Filter by state: BUILDING, READY, ERROR, QUEUED, CANCELED' },
            target: { type: 'string', description: 'Filter by target: production, preview' },
          },
        },
      },
      {
        name: 'get_deployment',
        description: 'Get details of a specific deployment',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: { type: 'string', description: 'Deployment ID or URL (required)' },
          },
          required: ['deploymentId'],
        },
      },
      {
        name: 'get_deployment_events',
        description: 'Get build logs/events for a deployment',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: { type: 'string', description: 'Deployment ID (required)' },
          },
          required: ['deploymentId'],
        },
      },
      {
        name: 'cancel_deployment',
        description: 'Cancel a running deployment',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: { type: 'string', description: 'Deployment ID to cancel (required)' },
          },
          required: ['deploymentId'],
        },
      },
      {
        name: 'redeploy',
        description: 'Trigger a redeployment of an existing deployment',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: { type: 'string', description: 'Deployment ID to redeploy (required)' },
            target: { type: 'string', description: 'Target environment: production or preview' },
          },
          required: ['deploymentId'],
        },
      },
      // Domains
      {
        name: 'list_domains',
        description: 'List all domains for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID or name (required)' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'get_domain',
        description: 'Get domain configuration details',
        inputSchema: {
          type: 'object',
          properties: {
            domain: { type: 'string', description: 'Domain name (required)' },
          },
          required: ['domain'],
        },
      },
      // Environment Variables
      {
        name: 'list_env_vars',
        description: 'List environment variables for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID or name (required)' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'get_env_var',
        description: 'Get a specific environment variable',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID or name (required)' },
            envId: { type: 'string', description: 'Environment variable ID (required)' },
          },
          required: ['projectId', 'envId'],
        },
      },
      {
        name: 'create_env_var',
        description: 'Create a new environment variable',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID or name (required)' },
            key: { type: 'string', description: 'Variable name (required)' },
            value: { type: 'string', description: 'Variable value (required)' },
            target: {
              type: 'array',
              items: { type: 'string' },
              description: 'Environments: production, preview, development (default: all)'
            },
            type: { type: 'string', description: 'Type: plain, encrypted, secret, sensitive (default: encrypted)' },
          },
          required: ['projectId', 'key', 'value'],
        },
      },
      {
        name: 'delete_env_var',
        description: 'Delete an environment variable',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID or name (required)' },
            envId: { type: 'string', description: 'Environment variable ID (required)' },
          },
          required: ['projectId', 'envId'],
        },
      },
      // Logs
      {
        name: 'get_logs',
        description: 'Get runtime logs for a deployment',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: { type: 'string', description: 'Deployment ID (required)' },
            limit: { type: 'number', description: 'Number of log entries (default: 100)' },
          },
          required: ['deploymentId'],
        },
      },
      // Aliases
      {
        name: 'list_aliases',
        description: 'List aliases (custom domains) for a deployment',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: 'Project ID to filter by' },
            deploymentId: { type: 'string', description: 'Deployment ID to filter by' },
            limit: { type: 'number', description: 'Number of aliases to return (default: 20)' },
          },
        },
      },
      // Checks
      {
        name: 'get_deployment_checks',
        description: 'Get deployment checks (build, functions, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: { type: 'string', description: 'Deployment ID (required)' },
          },
          required: ['deploymentId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!VERCEL_TOKEN) {
    return {
      content: [{ type: 'text', text: 'Error: VERCEL_TOKEN not configured. Please set the VERCEL_TOKEN environment variable.' }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'get_user': {
        const data = await fetchVercel('/v2/user');
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }

      case 'list_projects': {
        const params = new URLSearchParams();
        if (args?.limit) params.append('limit', args.limit.toString());
        if (args?.search) params.append('search', args.search);

        const data = await fetchVercel(`/v9/projects?${params}`);
        const projects = data.projects?.map((p) => ({
          id: p.id,
          name: p.name,
          framework: p.framework,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          latestDeployment: p.latestDeployments?.[0] ? {
            id: p.latestDeployments[0].id,
            url: p.latestDeployments[0].url,
            state: p.latestDeployments[0].readyState,
            createdAt: p.latestDeployments[0].createdAt,
          } : null,
        })) || [];

        return {
          content: [{ type: 'text', text: JSON.stringify({ projects, count: projects.length }, null, 2) }],
        };
      }

      case 'get_project': {
        const data = await fetchVercel(`/v9/projects/${args.projectId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify({
            id: data.id,
            name: data.name,
            framework: data.framework,
            nodeVersion: data.nodeVersion,
            buildCommand: data.buildCommand,
            outputDirectory: data.outputDirectory,
            rootDirectory: data.rootDirectory,
            installCommand: data.installCommand,
            devCommand: data.devCommand,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            link: data.link,
            latestDeployments: data.latestDeployments?.slice(0, 3).map((d) => ({
              id: d.id,
              url: d.url,
              state: d.readyState,
              target: d.target,
              createdAt: d.createdAt,
            })),
          }, null, 2) }],
        };
      }

      case 'list_deployments': {
        const params = new URLSearchParams();
        if (args?.projectId) params.append('projectId', args.projectId);
        if (args?.limit) params.append('limit', args.limit.toString());
        if (args?.state) params.append('state', args.state);
        if (args?.target) params.append('target', args.target);

        const data = await fetchVercel(`/v6/deployments?${params}`);
        const deployments = data.deployments?.map((d) => ({
          id: d.uid,
          name: d.name,
          url: d.url,
          state: d.readyState || d.state,
          target: d.target,
          createdAt: d.createdAt,
          buildingAt: d.buildingAt,
          ready: d.ready,
          source: d.source,
          meta: d.meta ? {
            githubCommitRef: d.meta.githubCommitRef,
            githubCommitMessage: d.meta.githubCommitMessage,
          } : null,
        })) || [];

        return {
          content: [{ type: 'text', text: JSON.stringify({ deployments, count: deployments.length }, null, 2) }],
        };
      }

      case 'get_deployment': {
        const data = await fetchVercel(`/v13/deployments/${args.deploymentId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify({
            id: data.id,
            name: data.name,
            url: data.url,
            inspectorUrl: data.inspectorUrl,
            state: data.readyState,
            target: data.target,
            createdAt: data.createdAt,
            buildingAt: data.buildingAt,
            ready: data.ready,
            source: data.source,
            regions: data.regions,
            routes: data.routes?.slice(0, 10),
            functions: data.functions ? Object.keys(data.functions) : null,
            meta: data.meta,
            errorCode: data.errorCode,
            errorMessage: data.errorMessage,
          }, null, 2) }],
        };
      }

      case 'get_deployment_events': {
        const data = await fetchVercel(`/v2/deployments/${args.deploymentId}/events`);
        const events = (Array.isArray(data) ? data : data.events || []).map((e) => ({
          type: e.type,
          created: e.created,
          text: e.payload?.text || e.text,
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(events.slice(-50), null, 2) }],
        };
      }

      case 'cancel_deployment': {
        const data = await fetchVercel(`/v12/deployments/${args.deploymentId}/cancel`, {
          method: 'PATCH',
        });
        return {
          content: [{ type: 'text', text: JSON.stringify({ message: 'Deployment cancelled', data }, null, 2) }],
        };
      }

      case 'redeploy': {
        const body = {};
        if (args?.target) body.target = args.target;

        const data = await fetchVercel(`/v13/deployments?forceNew=1&deploymentId=${args.deploymentId}`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify({
            message: 'Redeployment triggered',
            id: data.id,
            url: data.url,
            state: data.readyState,
          }, null, 2) }],
        };
      }

      case 'list_domains': {
        const data = await fetchVercel(`/v9/projects/${args.projectId}/domains`);
        return {
          content: [{ type: 'text', text: JSON.stringify(data.domains || data, null, 2) }],
        };
      }

      case 'get_domain': {
        const data = await fetchVercel(`/v5/domains/${args.domain}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }

      case 'list_env_vars': {
        const data = await fetchVercel(`/v9/projects/${args.projectId}/env`);
        const envVars = (data.envs || []).map((e) => ({
          id: e.id,
          key: e.key,
          value: e.type === 'secret' ? '***' : e.value,
          target: e.target,
          type: e.type,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(envVars, null, 2) }],
        };
      }

      case 'get_env_var': {
        const data = await fetchVercel(`/v9/projects/${args.projectId}/env/${args.envId}`);
        return {
          content: [{ type: 'text', text: JSON.stringify({
            id: data.id,
            key: data.key,
            value: data.type === 'secret' ? '***' : data.value,
            target: data.target,
            type: data.type,
          }, null, 2) }],
        };
      }

      case 'create_env_var': {
        const data = await fetchVercel(`/v10/projects/${args.projectId}/env`, {
          method: 'POST',
          body: JSON.stringify({
            key: args.key,
            value: args.value,
            target: args.target || ['production', 'preview', 'development'],
            type: args.type || 'encrypted',
          }),
        });
        return {
          content: [{ type: 'text', text: JSON.stringify({
            message: 'Environment variable created',
            id: data.id,
            key: data.key,
            target: data.target,
          }, null, 2) }],
        };
      }

      case 'delete_env_var': {
        await fetchVercel(`/v9/projects/${args.projectId}/env/${args.envId}`, {
          method: 'DELETE',
        });
        return {
          content: [{ type: 'text', text: JSON.stringify({ message: 'Environment variable deleted', envId: args.envId }, null, 2) }],
        };
      }

      case 'get_logs': {
        const params = new URLSearchParams();
        if (args?.limit) params.append('limit', args.limit.toString());

        const data = await fetchVercel(`/v2/deployments/${args.deploymentId}/events?${params}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }

      case 'list_aliases': {
        const params = new URLSearchParams();
        if (args?.projectId) params.append('projectId', args.projectId);
        if (args?.deploymentId) params.append('deploymentId', args.deploymentId);
        if (args?.limit) params.append('limit', args.limit.toString());

        const data = await fetchVercel(`/v4/aliases?${params}`);
        return {
          content: [{ type: 'text', text: JSON.stringify(data.aliases || data, null, 2) }],
        };
      }

      case 'get_deployment_checks': {
        const data = await fetchVercel(`/v1/deployments/${args.deploymentId}/checks`);
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
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
  console.error('Vercel MCP server running');
}

main().catch(console.error);
