#!/usr/bin/env bun
/**
 * build-release.ts — Build standalone MCP binaries untuk distribusi GitHub Releases
 *
 * Usage:
 *   bun scripts/build-release.ts                        # Build platform saat ini
 *   bun scripts/build-release.ts --target bun-linux-x64 # Cross-compile
 *   bun scripts/build-release.ts --js-only              # Hanya JS bundle
 *   bun scripts/build-release.ts --upload               # Build + upload ke release
 */

import { resolve, dirname, basename } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIVIDER = '\u2500'.repeat(60);
console.log(
  `\n\u2554${DIVIDER}\u2557\n\u2551  KAEDE \u2014 Build Release                        \u2551\n\u255A${DIVIDER}\u255D\n`,
);

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;
const args = process.argv.slice(2);
const UPLOAD = args.includes('--upload');
const JS_ONLY = args.includes('--js-only');
const TARGET_MAP: Record<string, string> = {
  win32: 'bun-windows-x64-modern',
  darwin: 'bun-darwin-arm64',
  linux: 'bun-linux-x64-modern',
};
const targetFlag = args.find((a) => a.startsWith('--target='));
const TARGET = targetFlag ? targetFlag.split('=')[1] : TARGET_MAP[process.platform] || 'bun-linux-x64';
const PLATFORM = TARGET.replace(/^bun-/, '')
  .replace(/-modern$/, '')
  .replace(/-baseline$/, '');
const log = (msg: string) => console.log(`  [${new Date().toLocaleTimeString()}] ${msg}`);
const run = (cmd: string, cwd = ROOT) => {
  log(`$ ${cmd}`);
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8' as BufferEncoding, stdio: 'pipe' });
  } catch (e: any) {
    console.error(`  \u2717 ${e.message}`);
    process.exit(1);
  }
};

const RELEASE_DIR = resolve(ROOT, 'dist', 'release');
const BIN_DIR = resolve(RELEASE_DIR, 'bin');
const BUNDLE_DIR = resolve(RELEASE_DIR, 'bundle');
for (const d of [RELEASE_DIR, BIN_DIR, BUNDLE_DIR]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

const SERVERS = [
  { name: 'kaede-mcp-server', label: 'Orchestrator MCP', entry: 'src/kaede-mcp-server.ts' },
  { name: 'kaede-trello-mcp', label: 'Trello MCP Library', entry: 'packages/kaede-trello/src/mcp-server.ts' },
];

// Step 1: JS bundles
console.log(`\n  ${'\u2500'.repeat(50)}`);
log('Building JS bundles...');
for (const s of SERVERS) {
  log(`${s.label} \u2192 bundle/${s.name}.js`);
  run(`bun build "${resolve(ROOT, s.entry)}" --target bun --minify --outfile "${resolve(BUNDLE_DIR, s.name)}.js"`);
}

// Step 2: Compiled binaries
if (!JS_ONLY) {
  console.log(`\n  ${'\u2500'.repeat(50)}`);
  log(`Building binaries (target: ${TARGET})...`);
  for (const s of SERVERS) {
    const ext = TARGET.includes('windows') ? '.exe' : '';
    const out = resolve(BIN_DIR, `${s.name}${ext}`);
    log(`${s.label} \u2192 bin/${s.name}${ext}`);
    run(`bun build --compile --target "${TARGET}" --minify "${resolve(ROOT, s.entry)}" --outfile "${out}"`);
    const size = existsSync(out) ? `${(readFileSync(out).length / 1024 / 1024).toFixed(1)} MB` : 'FAILED';
    log(`  Size: ${size}`);
  }
}

// Step 3: Env template
console.log(`\n  ${'\u2500'.repeat(50)}`);
log('Generating kaede.env.example...');
writeFileSync(
  resolve(RELEASE_DIR, 'kaede.env.example'),
  `# KAEDE \u2014 Trello API Credentials\n` +
    `# Copy ke ~/.config/kaede/secrets.env dan isi credentials\n\n` +
    `TRELLO_API_KEY=your_api_key_here\nTRELLO_TOKEN=your_token_here\nTRELLO_DEFAULT_BOARD_ID=\n`,
  'utf-8',
);

// Step 4: README
console.log(`\n  ${'\u2500'.repeat(50)}`);
log('Generating README.md...');
const ext = TARGET.includes('windows') ? '.exe' : '';
const readmeContent = `# KAEDE v${VERSION} \u2014 ${PLATFORM}

## Isi Archive

\`\`\`
bin/
\u2514\u2500\u2500 kaede-mcp-server${ext}     \u2014 Orchestrator (4 tools)
\u2514\u2500\u2500 kaede-trello-mcp${ext}     \u2014 Trello MCP (42 tools)
bundle/
\u2514\u2500\u2500 kaede-mcp-server.js       \u2014 JS bundle
\u2514\u2500\u2500 kaede-trello-mcp.js       \u2014 JS bundle
kaede.env.example             \u2014 Template credentials
README.md
\`\`\`

## Quick Start

1. Copy \`kaede.env.example\` \u2192 \`~/.config/kaede/secrets.env\`, isi API Key & Token
2. Konfigurasi di OpenCode:

\`\`\`json
{"mcp":{"kaede":{"command":"/path/bin/kaede-mcp-server${ext}"},"trello":{"command":"/path/bin/kaede-trello-mcp${ext}"}}}
\`\`\`

Dokumentasi: https://kaede-powerup.netlify.app
Source: https://github.com/konxc/kaede-powerup
`;
writeFileSync(resolve(RELEASE_DIR, 'README.md'), readmeContent, 'utf-8');

// Step 5: Archive
console.log(`\n  ${'\u2500'.repeat(50)}`);
log('Creating archive...');
const ARCHIVE_NAME = `kaede-v${VERSION}-${PLATFORM}`;
const archivePath = resolve(
  ROOT,
  'dist',
  process.platform === 'win32' ? `${ARCHIVE_NAME}.zip` : `${ARCHIVE_NAME}.tar.gz`,
);
if (existsSync(archivePath)) {
  try {
    run(`del "${archivePath}"`);
  } catch {
    run(`rm -f "${archivePath}"`);
  }
}
if (process.platform === 'win32') {
  // Use PowerShell Compress-Archive on Windows (handles absolute paths)
  const pwshCmd = `Compress-Archive -Path "${RELEASE_DIR}\*" -DestinationPath "${archivePath}" -Force`;
  run(`powershell -NoProfile -Command "${pwshCmd}"`);
} else {
  run(`tar -czf "${archivePath}" -C "${RELEASE_DIR}" .`);
}
log(`Archive: ${basename(archivePath)} (${(readFileSync(archivePath).length / 1024 / 1024).toFixed(1)} MB)`);

// Step 6: Upload
if (UPLOAD) {
  console.log(`\n  ${'\u2500'.repeat(50)}`);
  log('Uploading to GitHub Release...');
  run('gh --version');
  run(`gh release upload v${VERSION} "${archivePath}" --clobber`);
  const { readdirSync } = await import('fs');
  if (existsSync(BIN_DIR))
    for (const f of readdirSync(BIN_DIR)) run(`gh release upload v${VERSION} "${resolve(BIN_DIR, f)}" --clobber`);
  log('\u2705 Upload complete!');
}

console.log(`\n  ${'\u2500'.repeat(50)}`);
log('\u2705 Done!');
console.log(`\n  \uD83D\uDCE6 Archive: dist/${basename(archivePath)}`);
console.log(`  \uD83D\uDCC1 Files:   ${RELEASE_DIR}\n`);
