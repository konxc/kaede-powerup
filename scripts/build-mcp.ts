#!/usr/bin/env bun
/**
 * Build MCP Servers: Compile src/ → dist/ for both Trello MCP and KAEDE Orchestrator MCP
 *
 * Usage: bun scripts/build-mcp.ts
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function buildOne(label: string, src: string, dist: string): boolean {
  console.log(`  \x1b[36m  Building ${label}...\x1b[0m`);
  if (!existsSync(src)) {
    console.error(`  \x1b[31m  ✗ ${src} not found\x1b[0m`);
    return false;
  }
  try {
    execSync(`bun build ${src} --target bun --minify --outfile ${dist}`, {
      cwd: ROOT,
      stdio: 'inherit',
    });
    console.log(`  \x1b[32m  ✓ ${label} built\x1b[0m`);
    return true;
  } catch (err) {
    console.error(`  \x1b[31m  ✗ ${label} build failed: ${(err as Error).message}\x1b[0m`);
    return false;
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║      KAEDE — Build MCP Servers           ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════════╝\x1b[0m');
  console.log('');

  const trelloOk = buildOne(
    'Trello MCP',
    resolve(ROOT, 'packages', 'kaede-trello', 'src', 'mcp-server.ts'),
    resolve(ROOT, 'dist', 'mcp-server.js'),
  );

  const kaedeOk = buildOne(
    'KAEDE Orchestrator MCP',
    resolve(ROOT, 'src', 'kaede-mcp-server.ts'),
    resolve(ROOT, 'dist', 'kaede-mcp-server.js'),
  );

  console.log('');
  if (trelloOk && kaedeOk) {
    console.log('  \x1b[32m  ✅  Both MCP servers built successfully.\x1b[0m');
  } else if (trelloOk) {
    console.log('  \x1b[33m  ⚠  Only Trello MCP built (KAEDE MCP failed).\x1b[0m');
  } else if (kaedeOk) {
    console.log('  \x1b[33m  ⚠  Only KAEDE MCP built (Trello MCP failed).\x1b[0m');
  } else {
    console.log('  \x1b[31m  ✗ Both builds failed.\x1b[0m');
  }
  console.log('');
}

main().catch((err: Error) => {
  console.error('  \x1b[31m  ✗ Build failed:\x1b[0m', err.message);
  process.exit(1);
});
