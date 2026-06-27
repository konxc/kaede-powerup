# Getting Trello API Key & Token

To connect an AI Agent with Trello, you need two credentials: an **API Key** and a **Token**. Both are obtained through the Trello Power-Up Admin panel.

<div class="not-prose p-4 rounded-xl bg-kaede-warning/10 border border-kaede-warning/20 mb-6">

**Prerequisites**

- A Trello account (free)
- Access to [Trello Power-Up Admin](https://trello.com/power-ups/admin)

</div>

## Method 1: Via Power-Up Admin (Recommended)

<div class="not-prose space-y-4">

<div class="flex items-start gap-3">
  <span class="step-num">1</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Open Trello Power-Up Admin</p>
    <p class="text-xs text-kaede-muted">Visit <a href="https://trello.com/power-ups/admin" target="_blank" class="text-kaede-primary underline">trello.com/power-ups/admin</a> and log in with your Trello account.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">2</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Create a New Power-Up</p>
    <p class="text-xs text-kaede-muted">Click the <strong class="text-kaede-text">New</strong> button. Fill in the form:</p>
    <ul class="text-xs text-kaede-muted mt-1 space-y-0.5">
      <li><strong class="text-kaede-text">Integration Name:</strong> <code>KAEDE — Koneksi Team</code></li>
      <li><strong class="text-kaede-text">Email:</strong> Your team email</li>
      <li><strong class="text-kaede-text">Support:</strong> Repository URL or email</li>
      <li><strong class="text-kaede-text">Name:</strong> Power-Up name</li>
    </ul>
    <p class="text-xs text-kaede-muted mt-1">Select the appropriate Trello instance, then click <strong class="text-kaede-text">Create</strong>.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">3</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Generate API Key</p>
    <p class="text-xs text-kaede-muted">On the Power-Up page, navigate to the <strong class="text-kaede-text">API Key</strong> tab. Click <strong class="text-kaede-text">Generate</strong> to get your API Key. <strong class="text-kaede-text">Copy the API Key</strong> — you will need it later.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">4</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Generate Token</p>
    <p class="text-xs text-kaede-muted">On the same page, find the <strong class="text-kaede-text">manually generate a Token</strong> link (usually next to the API Key description). Click that link.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">5</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Authorize</p>
    <p class="text-xs text-kaede-muted">The Trello authorization page will open. Click <strong class="text-kaede-text">Allow</strong> to grant access to your Trello account.</p>
  </div>
</div>

<div class="flex items-start gap-3">
  <span class="step-num">6</span>
  <div>
    <p class="text-sm font-medium text-kaede-text">Copy Token</p>
    <p class="text-xs text-kaede-muted">After allowing, you will see the Token string. <strong class="text-kaede-text">Copy this token</strong> and save it alongside your API Key.</p>
  </div>
</div>

</div>

## Method 2: Quick Way

If you already have a Power-Up, directly open:

1. Visit [trello.com/app-key](https://trello.com/app-key)
2. Copy the **API Key** from that page
3. Click the **Token** link to generate a token
4. Click **Allow** and copy the token

## Important Notes

- **API Key** and **Token** are secret — do not commit them to git or share publicly
- Tokens can be revoked anytime from the Power-Up Admin page
- If a token expires, repeat the token generation steps
- Save credentials in a `.env` file or `~/.config/dev/*.env`

<div class="not-prose p-4 rounded-xl bg-kaede-surface border border-kaede-border mt-6">

**Example .env**

<div class="code-block">
<span class="cm"># Trello API credentials</span><br/>
TRELLO_API_KEY=<span class="str">your-api-key-here</span><br/>
TRELLO_TOKEN=<span class="str">your-token-here</span>
</div>

</div>

## Next Steps

Once you have your API Key and Token, proceed to the [MCP Server Setup](mcp-server.html) guide to configure the Trello MCP server.
