# Trello MCP Integration with OpenCode

Once the Trello MCP server is running, the next step is connecting it to **OpenCode** — the AI coding agent used by Koneksi team. With this integration, the AI Agent can read and write Trello directly from conversation.

<div class="not-prose p-4 rounded-xl bg-kaede-primary/10 border border-kaede-primary/20 mb-6">

**Prerequisites**

- Trello MCP Server installed — [see guide](mcp-server.html)
- Trello API Key & Token — [see guide](api-key.html)
- OpenCode installed in your working environment

</div>

## 1. Add MCP Server to OpenCode

Edit your `.opencode/opencode.json` in your repository:

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

<div class="not-prose p-3 rounded-lg bg-kaede-surface border border-kaede-border mt-2">

**Do not hardcode credentials!** In production, use environment variables from `~/.config/dev/*.env` instead of inline values.

</div>

## 2. Verify Connection

1. Restart OpenCode session
2. Try:

    ```
    List all my Trello boards.
    ```

3. If OpenCode responds with a board list, the connection works!

## 3. Usage Examples

<div class="not-prose glass rounded-xl p-4 space-y-3">

<div class="flex items-start gap-2">
  <span class="text-[10px] font-bold text-kaede-success px-1.5 py-0.5 rounded bg-kaede-success/20 shrink-0 mt-0.5">You</span>
  <p class="text-xs text-kaede-muted">"What tasks are in 'In Progress' on my project board?"</p>
</div>

<div class="flex items-start gap-2">
  <span class="text-[10px] font-bold text-kaede-primary px-1.5 py-0.5 rounded bg-kaede-primary/20 shrink-0 mt-0.5">AI</span>
  <p class="text-xs text-kaede-muted">"There are 3 cards in 'In Progress': 'Fix login bug' (started Jun 24), 'Update dashboard' (due Jun 28), 'Integrate payment API' (due Jun 30)."</p>
</div>

<div class="border-t border-kaede-border/50 pt-2 flex items-start gap-2">
  <span class="text-[10px] font-bold text-kaede-success px-1.5 py-0.5 rounded bg-kaede-success/20 shrink-0 mt-0.5">You</span>
  <p class="text-xs text-kaede-muted">"Create a new card 'Setup CI/CD pipeline' in 'To Do' list with development label."</p>
</div>

<div class="flex items-start gap-2">
  <span class="text-[10px] font-bold text-kaede-primary px-1.5 py-0.5 rounded bg-kaede-primary/20 shrink-0 mt-0.5">AI</span>
  <p class="text-xs text-kaede-muted">"Card 'Setup CI/CD pipeline' has been created in 'To Do' list with development label."</p>
</div>

</div>

## 4. Set Active Board

Before starting, set which board to work on:

```
Set my active board to "Sprint 24".
```

Or if you know the Board ID:

```
Use set_active_board with boardId "abc123xyz".
```

## 5. Best Practices

- **Use active board:** Set active board at the start of each session for clear context
- **Check first:** Ask AI to "List boards" before starting
- **Labels:** Use Trello label IDs (check via `get_board_custom_fields`)
- **Workspace restriction:** Enable `TRELLO_ALLOWED_WORKSPACES` for security

## 6. Credential Security

Follow these rules to keep credentials safe:

- Do not commit `.env` or credentials to git
- Use `~/.config/dev/*.env` to store secrets
- In OpenCode, reference environment variables, not hardcoded values
- Rotate tokens regularly

## Next Steps

Once integration is complete, see the [Tools Reference](tools.html) for a full list of available tools.
