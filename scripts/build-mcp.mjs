#!/usr/bin/env node
/**
 * Build MCP Server: Compile src/mcp-server.js → dist/mcp-server.js
 *
 * Usage: node scripts/build-mcp.mjs
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

async function main() {
  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║      KAEDE — Build MCP Server        ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════╝\x1b[0m');
  console.log('');

  const srcPath = resolve(ROOT, 'src', 'mcp-server.js');
  const distPath = resolve(ROOT, 'dist', 'mcp-server.js');

  if (!existsSync(srcPath)) {
    console.error('  \x1b[31m  ✗ src/mcp-server.js not found\x1b[0m');
    process.exit(1);
  }

  try {
    execSync(`bun build ${srcPath} --target bun --minify --outfile ${distPath}`, {
      cwd: ROOT,
      stdio: 'inherit',
    });
    console.log('');
    console.log('  \x1b[32m  ✅  Build successful.\x1b[0m');
    console.log('');
  } catch (err) {
    console.error('  \x1b[31m  ✗ Build failed:\x1b[0m', err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('  \x1b[31m  ✗ Build failed:\x1b[0m', err.message);
  process.exit(1);
});