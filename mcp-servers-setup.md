# MCP Servers Setup Guide

This project includes two MCP (Model Context Protocol) servers for Claude Code integration:

1. **WordPress MCP** - Query cursedtours.com content
2. **Vercel MCP** - Manage deployments and environment

## Prerequisites

- Node.js 18+ installed
- Claude Code installed
- Vercel account (for Vercel MCP)

## Installation

### 1. Install Dependencies

```bash
cd mcp-wordpress && npm install
cd ../mcp-vercel && npm install
```

### 2. Get Vercel API Token

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it (e.g., "Claude Code MCP")
4. Set scope to your account or team
5. Copy the token (you won't see it again!)

### 3. Configure Claude Code

#### Windows
Edit `%USERPROFILE%\.claude\settings.json`:

```json
{
  "mcpServers": {
    "wordpress-cursedtours": {
      "command": "node",
      "args": ["D:/New folder/Headless-main/Headless-main/mcp-wordpress/index.js"],
      "env": {
        "WORDPRESS_URL": "https://cursedtours.com"
      }
    },
    "vercel": {
      "command": "node",
      "args": ["D:/New folder/Headless-main/Headless-main/mcp-vercel/index.js"],
      "env": {
        "VERCEL_TOKEN": "YOUR_VERCEL_TOKEN_HERE"
      }
    }
  }
}
```

#### macOS/Linux
Edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "wordpress-cursedtours": {
      "command": "node",
      "args": ["/path/to/Headless/mcp-wordpress/index.js"],
      "env": {
        "WORDPRESS_URL": "https://cursedtours.com"
      }
    },
    "vercel": {
      "command": "node",
      "args": ["/path/to/Headless/mcp-vercel/index.js"],
      "env": {
        "VERCEL_TOKEN": "YOUR_VERCEL_TOKEN_HERE"
      }
    }
  }
}
```

### 4. Restart Claude Code

After saving the settings, restart Claude Code for the MCP servers to load.

## Available Tools

### WordPress MCP (15 tools)

| Tool | Description |
|------|-------------|
| `get_posts` | Fetch posts with pagination, filters |
| `get_post` | Get single post by slug/ID |
| `get_pages` | Fetch WordPress pages |
| `get_page` | Get single page by slug/ID |
| `get_categories` | List all categories |
| `get_tags` | List all tags |
| `get_media` | Fetch images/media |
| `get_authors` | List authors |
| `get_comments` | Fetch comments |
| `get_seo_meta` | Get Yoast/RankMath SEO data |
| `get_menus` | Fetch navigation menus |
| `search_content` | Search posts & pages |
| `get_taxonomies` | List taxonomies |
| `get_post_types` | List post types |
| `get_site_info` | Get site metadata |

### Vercel MCP (17 tools)

| Tool | Description |
|------|-------------|
| `get_user` | Get account info |
| `list_projects` | List all projects |
| `get_project` | Get project details |
| `list_deployments` | List deployments |
| `get_deployment` | Get deployment details |
| `get_deployment_events` | Get build logs |
| `cancel_deployment` | Cancel running deployment |
| `redeploy` | Trigger redeployment |
| `list_domains` | List project domains |
| `get_domain` | Get domain config |
| `list_env_vars` | List environment variables |
| `get_env_var` | Get specific env var |
| `create_env_var` | Create new env var |
| `delete_env_var` | Delete env var |
| `get_logs` | Get runtime logs |
| `list_aliases` | List domain aliases |
| `get_deployment_checks` | Get build checks |

## Troubleshooting

### MCP server not loading
- Ensure Node.js is in your PATH
- Check the file paths in settings.json are correct
- Verify dependencies are installed (`npm install` in each mcp-* folder)

### Vercel API errors
- Verify your VERCEL_TOKEN is valid
- Check token has correct permissions
- For team projects, add `VERCEL_TEAM_ID` to env

### WordPress API errors
- Verify the WordPress site is accessible
- Check REST API is enabled on the WordPress site
