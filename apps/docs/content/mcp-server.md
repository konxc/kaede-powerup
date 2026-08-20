# Setup Trello MCP Server

**Trello MCP Server** ([delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello)) is an open-source server that bridges the Trello API with AI Agents via the MCP protocol. It handles rate limiting, input validation, and error handling automatically.

<div class="not-prose p-4 rounded-xl bg-kaede-success/10 border border-kaede-success/20 mb-6">

**Prerequisites**

- Node.js 18+ or **Bun** v1.0+ (recommended — 2.8-4.4x faster)
- Trello API Key & Token — [see guide](api-key.html)

</div>

## Installation

### Option A: Using Bunx (Easiest)

```bash
bunx @delorenj/mcp-server-trello
```

### Option B: Clone Repository

```bash
git clone https://github.com/delorenj/mcp-server-trello.git
cd mcp-server-trello
bun install
bun run build
```

## Environment Variables

Create a `.env` file in the server directory:

```env
# Required: Trello API credentials
TRELLO_API_KEY=your-api-key
TRELLO_TOKEN=your-token

# Optional: Default board ID (can be changed via set_active_board)
TRELLO_BOARD_ID=your-board-id

# Optional: Initial workspace ID
TRELLO_WORKSPACE_ID=your-workspace-id

# Optional: Proxy for corporate network
https_proxy=http://your-proxy:8080

# Optional: Restrict access to specific workspaces
TRELLO_ALLOWED_WORKSPACES=workspace-id-1,workspace-id-2
```

## Configuration for OpenCode / Claude Desktop

Add the MCP server to your MCP client configuration:

### Claude Desktop

```json
{
  "mcpServers": {
    "trello": {
      "command": "bunx",
      "args": ["@delorenj/mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "your-api-key",
        "TRELLO_TOKEN": "your-token"
      }
    }
  }
}
```

### OpenCode

```json
{
  "mcp": {
    "trello": {
      "type": "local",
      "command": "bunx",
      "args": ["@delorenj/mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "your-api-key",
        "TRELLO_TOKEN": "your-token"
      },
      "enabled": true
    }
  }
}
```

## Verify Setup

To confirm the server is running correctly:

1. Start the server: `bunx @delorenj/mcp-server-trello`
2. Open your MCP client (OpenCode / Claude Desktop)
3. Try: *"List all my Trello boards"*
4. If you get a response, setup is complete!

## Board & Workspace Management

The server supports multiple boards and workspaces:

- **Dynamic board selection:** Use `set_active_board` to switch boards without restart
- **Multi-board support:** All methods accept an optional `boardId` parameter
- **Workspace restriction:** Limit AI access to specific workspaces via `TRELLO_ALLOWED_WORKSPACES`

Configuration persists at `~/.trello-mcp/config.json`.

## Rate Limiting

The server uses a **token bucket algorithm** to comply with Trello API limits:

- 300 requests per 10 seconds per API key
- 100 requests per 10 seconds per token
- Requests are queued if limits are reached

## Language Selection

This documentation is available in:

- [English (Default)](/)
- [Bahasa Indonesia](id/)

## Next Steps

Once the server is running, proceed to the [OpenCode Integration](opencode.html) guide to configure your AI Agent.
