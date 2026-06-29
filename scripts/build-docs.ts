/**
 * Build docs: Markdown → HTML (KAEDE theme with Multilingual Support)
 *
 * Reads docs/*.md and docs/id/*.md, renders them to HTML,
 * outputs to dist-docs/ and dist-docs/id/ for GitHub Pages.
 *
 * Usage: bun scripts/build-docs.ts
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_DIR = join(ROOT, 'docs');
const OUT_DIR = join(ROOT, 'dist-docs');

// ── CSS source resolution ──
function resolveCss(): string | null {
  const compiledPath = join(ROOT, 'public', 'css', 'style.css');
  if (existsSync(compiledPath)) return compiledPath;

  const srcPath = join(ROOT, 'src', 'style.css');
  if (existsSync(srcPath)) {
    console.warn('⚠ public/css/style.css not found — using src/style.css');
    return srcPath;
  }

  console.warn('⚠ No CSS found — documentation will render without styling');
  return null;
}

// ── Page registries per language ──
const PAGES_EN = [
  {
    id: 'index',
    label: 'Overview',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'api-key',
    label: 'API Key',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  },
  {
    id: 'mcp-server',
    label: 'MCP Server',
    icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
  {
    id: 'tools',
    label: 'Tools Reference',
    icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 00-1-1h-1a2 2 0 110-4h1a1 1 0 001-1v-3a1 1 0 011-1h3a1 1 0 001-1V4z',
  },
  {
    id: 'sdlc-roles',
    label: 'SDLC Roles',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  },
  {
    id: 'role-management',
    label: 'Role Management',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 'kaede-architecture',
    label: 'Architecture',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
  {
    id: 'playbook-template',
    label: 'Playbook',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'sponsorship',
    label: 'Sponsorship',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

const PAGES_ID = [
  {
    id: 'index',
    label: 'Ikhtisar',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    id: 'api-key',
    label: 'API Key',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  },
  {
    id: 'mcp-server',
    label: 'Server MCP',
    icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  },
  {
    id: 'tools',
    label: 'Referensi Tools',
    icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3a1 1 0 00-1-1h-1a2 2 0 110-4h1a1 1 0 001-1v-3a1 1 0 011-1h3a1 1 0 001-1V4z',
  },
  {
    id: 'sdlc-roles',
    label: 'Peran SDLC',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  },
  {
    id: 'role-management',
    label: 'Manajemen Peran',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 'kaede-architecture',
    label: 'Arsitektur',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
  {
    id: 'playbook-template',
    label: 'Playbook',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'sponsorship',
    label: 'Sponsor',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

// ── Read markdown ──
function readDoc(lang: string, pageId: string): string | null {
  const base = lang === 'id' ? join(DOCS_DIR, 'id') : DOCS_DIR;
  const path = join(base, `${pageId}.md`);
  return existsSync(path) ? readFileSync(path, 'utf-8') : null;
}

// ── Build HTML ──
function buildHtml(lang: string, pageId: string, content: string, pages: typeof PAGES_EN): string {
  const doubleDash = '\u2014';
  const isID = lang === 'id';
  const siteTitle = isID ? 'Dokumentasi KAEDE' : 'KAEDE Documentation';
  const pageLabel = pages.find((p) => p.id === pageId)?.label || pageId;
  const docTitle =
    content
      .match(/^#\s+(.+)/m)?.[1]
      ?.replace(/\s*\{[^}]*\}\s*$/, '')
      .trim() || pageLabel;

  const sidebarItems = pages
    .map(
      (p) => `
          <li>
            <a href="${p.id === 'index' ? '.' : `${p.id}.html`}" class="sidebar-item${p.id === pageId ? ' active' : ''}">
              <svg class="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${p.icon}"/></svg>
              <span>${p.label}</span>
            </a>
          </li>`,
    )
    .join('\n');

  const currentLang = isID ? 'id' : 'en';
  const otherLang = isID ? 'en' : 'id';
  const otherLabel = isID ? 'English' : 'Bahasa';
  const otherPrefix = isID ? '..' : 'id';

  return `<!DOCTYPE html>
<html lang="${currentLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${docTitle} ${doubleDash} ${siteTitle}</title>
  <link rel="stylesheet" href="css/style.css" />
  <link rel="icon" type="image/svg+xml" href="https://kaede-powerup.netlify.app/kaede.svg" />
</head>
<body class="docs-body">
  <nav class="docs-nav">
    <div class="docs-nav-inner">
      <a href="." class="docs-logo">
        <svg class="kaede-logo" viewBox="0 0 40 40" fill="none">
          <path d="M20 4L8 12v16l12 8 12-8V12L20 4z" fill="currentColor" opacity="0.2"/>
          <path d="M20 8l-8 5.333V26.67l8 5.333 8-5.333V13.333L20 8z" fill="currentColor" opacity="0.4"/>
          <path d="M20 12l-5.333 3.555v8.89L20 28l5.333-3.555v-8.89L20 12z" fill="currentColor"/>
        </svg>
        <span class="docs-logo-text">KAEDE</span>
      </a>
      <div class="docs-nav-links">
        <a href="${otherPrefix}/index.html" class="lang-switch">${otherLabel}</a>
        <a href="https://github.com/konxc/kaede-powerup" class="github-link" target="_blank">
          <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>
      </div>
    </div>
  </nav>
  <div class="docs-container">
    <aside class="docs-sidebar">
      <ul class="sidebar-list">
        ${sidebarItems}
      </ul>
    </aside>
    <main class="docs-content">
      ${content
        .replace(/```(\w*)\n([\s\S]*?)```/g, (_, langName, code) => {
          const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return '<pre class="code-block"><code>' + escaped + '</code></pre>';
        })
        .replace(/^-{3,}\s*$/gm, '<hr>')
        .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
        .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
        .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
        .replace(/^- \*\*(.+?)\*\*:\s*(.*)$/gm, '<li><strong>$1</strong>: $2</li>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')}
    </main>
  </div>
  <footer class="docs-footer">
    <p>&copy; ${new Date().getFullYear()} KAEDE by Koneksi Jaringan Indonesia</p>
  </footer>
</body>
</html>`;
}

// ── Main ──
async function main(): Promise<void> {
  console.log('');

  // Ensure output directory exists
  mkdirSync(OUT_DIR, { recursive: true });

  // Copy CSS
  const cssPath = resolveCss();
  if (cssPath) {
    const cssOutDir = join(OUT_DIR, 'css');
    mkdirSync(cssOutDir, { recursive: true });
    cpSync(cssPath, join(cssOutDir, 'style.css'));
    console.log(`\x1b[36m  ✓\x1b[0m Copied css/style.css from ${cssPath.replace(ROOT, '.')}`);
  }

  // Copy JS components
  const jsSrc = join(ROOT, 'public', 'js', 'components.js');
  if (existsSync(jsSrc)) {
    const jsOutDir = join(OUT_DIR, 'js');
    mkdirSync(jsOutDir, { recursive: true });
    cpSync(jsSrc, join(jsOutDir, 'components.js'));
    console.log(`\x1b[36m  ✓\x1b[0m Copied js/components.js from .\\public\\js\\components.js`);
  }

  // Build pages
  const { marked } = await import('marked');

  for (const [lang, pages] of [
    ['en', PAGES_EN],
    ['id', PAGES_ID],
  ] as const) {
    for (const page of pages) {
      const md = readDoc(lang, page.id);
      if (!md) {
        console.warn(`  \x1b[33m  ⚠ ${lang}/${page.id}.md not found\x1b[0m`);
        continue;
      }

      // Remove YAML front matter if present
      const cleanMd = md.replace(/^---[\s\S]*?---\n*/, '');

      const html = marked(cleanMd, { async: false }) as string;
      const finalHtml = buildHtml(lang, page.id, cleanMd, pages);

      if (lang === 'id') {
        const outIdDir = join(OUT_DIR, 'id');
        mkdirSync(outIdDir, { recursive: true });
        writeFileSync(join(outIdDir, `${page.id}.html`), finalHtml, 'utf-8');
        console.log(
          `\x1b[36m  ✓\x1b[0m ID: ${page.label} \u2192 ${join(OUT_DIR, 'id', `${page.id}.html`).replace(ROOT, '.')}`,
        );
      } else {
        writeFileSync(join(OUT_DIR, `${page.id}.html`), finalHtml, 'utf-8');
        console.log(
          `\x1b[36m  ✓\x1b[0m EN: ${page.label} \u2192 ${join(OUT_DIR, `${page.id}.html`).replace(ROOT, '.')}`,
        );
      }
    }
  }

  // Privacy page (single page, no sidebar)
  for (const [lang, suffix] of [
    ['en', ''],
    ['id', 'id'],
  ] as const) {
    const srcPath = join(DOCS_DIR, suffix ? 'id' : '', 'privacy.md');
    if (!existsSync(srcPath)) {
      console.warn(`  \x1b[33m  ⚠ ${lang}/privacy.md not found\x1b[0m`);
      continue;
    }
    const md = readFileSync(srcPath, 'utf-8');
    const cleanMd = md.replace(/^---[\s\S]*?---\n*/, '');
    const html = marked(cleanMd, { async: false }) as string;
    const doubleDash = '\u2014';
    const langAttr = lang === 'id' ? 'id' : 'en';
    const siteTitle = lang === 'id' ? 'Kebijakan Privasi' : 'Privacy Policy';
    const outPath = suffix ? join(OUT_DIR, suffix, 'privacy.html') : join(OUT_DIR, 'privacy.html');

    const finalHtml = `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${siteTitle} ${doubleDash} KAEDE</title>
  <link rel="stylesheet" href="css/style.css" />
  <link rel="icon" type="image/svg+xml" href="https://kaede-powerup.netlify.app/kaede.svg" />
</head>
<body class="docs-body">
  <nav class="docs-nav">
    <div class="docs-nav-inner">
      <a href="." class="docs-logo">
        <svg class="kaede-logo" viewBox="0 0 40 40" fill="none">
          <path d="M20 4L8 12v16l12 8 12-8V12L20 4z" fill="currentColor" opacity="0.2"/>
          <path d="M20 8l-8 5.333V26.67l8 5.333 8-5.333V13.333L20 8z" fill="currentColor" opacity="0.4"/>
          <path d="M20 12l-5.333 3.555v8.89L20 28l5.333-3.555v-8.89L20 12z" fill="currentColor"/>
        </svg>
        <span class="docs-logo-text">KAEDE</span>
      </a>
    </div>
  </nav>
  <div class="docs-container" style="max-width:800px;margin:0 auto;padding:2rem 1rem;">
    ${html}
  </div>
</body>
</html>`;
    writeFileSync(outPath, finalHtml, 'utf-8');
    console.log(`\x1b[36m  ✓\x1b[0m ${lang.toUpperCase()} privacy \u2192 ${outPath.replace(ROOT, '.')}`);
  }

  console.log(`\n  \x1b[32m  Done. Output in ${OUT_DIR.replace(ROOT, '.')}/\x1b[0m`);
}

main().catch((err: Error) => {
  console.error('  \x1b[31m  ✗ Build failed:\x1b[0m', err.message);
  process.exit(1);
});
