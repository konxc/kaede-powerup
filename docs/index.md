# KAEDE Documentation

KAEDE bridges Trello project management with AI Agents — from getting API credentials to full OpenCode integration and MCP orchestration.

## Quick Start

Follow these 3 steps to start using Trello MCP:

1. **[Get API Key & Token](api-key.html)** — Create a Trello Power-Up and generate credentials.
2. **[Setup MCP Server](mcp-server.html)** — Install and configure `@delorenj/mcp-server-trello`.
3. **[OpenCode Integration](opencode.html)** — Add the MCP server to your `opencode.json`.

## Page Index

### User Documentation

<div class="grid sm:grid-cols-2 gap-4 not-prose">

<a href="api-key.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-primary/20 text-kaede-primary mb-2 text-sm font-bold">1</div>
  <h3 class="text-sm font-semibold text-kaede-text">API Key & Token</h3>
  <p class="text-xs text-kaede-muted mt-1">Step-by-step guide to obtain Trello API credentials via Power-Up admin.</p>
</a>

<a href="mcp-server.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-success/20 text-kaede-success mb-2 text-sm font-bold">2</div>
  <h3 class="text-sm font-semibold text-kaede-text">MCP Server</h3>
  <p class="text-xs text-kaede-muted mt-1">Install and configure the Trello MCP server, environment variables, and board/workspace management.</p>
</a>

<a href="opencode.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-warning/20 text-kaede-warning mb-2 text-sm font-bold">3</div>
  <h3 class="text-sm font-semibold text-kaede-text">OpenCode Integration</h3>
  <p class="text-xs text-kaede-muted mt-1">How to add Trello MCP to your opencode.json and use tools from your AI Agent.</p>
</a>

<a href="tools.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-danger/20 text-kaede-danger mb-2 text-sm font-bold">4</div>
  <h3 class="text-sm font-semibold text-kaede-text">Tools Reference</h3>
  <p class="text-xs text-kaede-muted mt-1">Complete list of all MCP tools: cards, lists, checklists, comments, attachments, custom fields.</p>
</a>

</div>

### Development Documentation

<div class="grid sm:grid-cols-2 gap-4 not-prose mt-6">

<a href="sdlc-roles.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-primary/20 text-kaede-primary mb-2 text-sm font-bold">👥</div>
  <h3 class="text-sm font-semibold text-kaede-text">SDLC Roles</h3>
  <p class="text-xs text-kaede-muted mt-1">Who uses KAEDE across the software development lifecycle — PM, Dev, QA, Tech Lead, Stakeholder.</p>
</a>

<a href="DEVELOPMENT-ROADMAP.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-primary/20 text-kaede-primary mb-2 text-sm font-bold">📋</div>
  <h3 class="text-sm font-semibold text-kaede-text">Development Roadmap</h3>
  <p class="text-xs text-kaede-muted mt-1">Master development plan: 3-phase implementation, timeline, upstream contribution strategy.</p>
</a>

<a href="CONTRIBUTING.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-success/20 text-kaede-success mb-2 text-sm font-bold">🤝</div>
  <h3 class="text-sm font-semibold text-kaede-text">Contribution Guide</h3>
  <p class="text-xs text-kaede-muted mt-1">Upstream contribution guide for Trello MCP: PR workflow, testing, communication templates.</p>
</a>

<a href="FEATURE-SPECIFICATION.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-warning/20 text-kaede-warning mb-2 text-sm font-bold">⚙️</div>
  <h3 class="text-sm font-semibold text-kaede-text">Feature Specification</h3>
  <p class="text-xs text-kaede-muted mt-1">Detailed specs: attachments, copy card, checklist enhancements, advanced features.</p>
</a>

<a href="kaede-architecture.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-danger/20 text-kaede-danger mb-2 text-sm font-bold">🏗️</div>
  <h3 class="text-sm font-semibold text-kaede-text">Architecture</h3>
  <p class="text-xs text-kaede-muted mt-1">KAEDE architecture, concern separation, orchestration layer, ecosystem overview.</p>
</a>

<a href="playbook-template.html" class="glass rounded-xl p-4 no-underline hover:border-kaede-primary transition-colors block border border-transparent">
  <div class="flex items-center justify-center size-9 rounded-lg bg-kaede-warning/20 text-kaede-warning mb-2 text-sm font-bold">📄</div>
  <h3 class="text-sm font-semibold text-kaede-text">Playbook Template</h3>
  <p class="text-xs text-kaede-muted mt-1">Universal playbook template for team SOPs, workflow, and AI Agent collaboration.</p>
</a>

</div>

## About Trello MCP

**MCP (Model Context Protocol)** is an open standard that enables AI Agents to communicate with external tools. **Trello MCP Server** ([delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello)) bridges the Trello API with AI Agents — allowing agents to read, create, and update Trello cards directly from conversation.

The server handles rate limiting (300 req/10s per API key, 100 req/10s per token), input validation, and error handling automatically.

## Quick Links

- [Trello Power-Up Admin](https://trello.com/power-ups/admin) — Create and manage Power-Ups
- [GitHub: delorenj/mcp-server-trello](https://github.com/delorenj/mcp-server-trello) — Main repository
- [npm: @delorenj/mcp-server-trello](https://www.npmjs.com/package/@delorenj/mcp-server-trello) — npm package
