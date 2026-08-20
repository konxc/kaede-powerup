/**
 * Build docs: Markdown → HTML (KAEDE Rich Theme with Multilingual Support)
 *
 * Reads apps/docs/content/*.md and apps/docs/content/id/*.md, renders them to HTML,
 * outputs to apps/docs/dist/ and apps/docs/dist/id/ for GitHub Pages.
 *
 * Uses the same rich template as gh-pages: navbar, glass, prose, mobile nav.
 *
 * Usage: bun scripts/build-docs.ts
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = join(__dirname, '..', '..', '..');
const DOCS_DIR = join(WORKSPACE_ROOT, 'apps', 'docs', 'content');
const OUT_DIR = join(WORKSPACE_ROOT, 'apps', 'docs', 'dist');
const WEB_DIST = join(WORKSPACE_ROOT, 'apps', 'static', 'dist');
const WEB_CSS_SRC = join(WORKSPACE_ROOT, 'apps', 'static', 'src', 'style.css');
const COMPONENTS_SRC = join(WORKSPACE_ROOT, 'apps', 'static', 'public', 'js', 'components.js');

// ── SVG icons for sidebar & mobile nav ──
const ICONS: Record<string, string> = {
  overview: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  api: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  server: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
  code: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  tools: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  roles: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  access: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  arch: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  playbook: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  checklist: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4l2 3m0 0l3-3m-3 3v6',
  money: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
};

// ── CSS source resolution ──
function resolveCss(): string | null {
  const assetsDir = join(WEB_DIST, 'assets');
  if (existsSync(assetsDir)) {
    const compiled = readdirSync(assetsDir)
      .filter((f) => f.endsWith('.css'))
      .sort((a, b) => (a.startsWith('web-') ? -1 : 0) - (b.startsWith('web-') ? -1 : 0));
    if (compiled.length > 0) return join(assetsDir, compiled[0]);
  }

  if (existsSync(WEB_CSS_SRC)) {
    console.warn('⚠ Compiled CSS not found in apps/static/dist — using apps/static/src/style.css');
    return WEB_CSS_SRC;
  }

  console.warn('⚠ No CSS found — documentation will render without styling');
  return null;
}

// ── Page registries per language ──
interface PageEntry {
  id: string;
  label: string;
  icon: string;
}

const PAGES_EN: PageEntry[] = [
  { id: 'index', label: 'Overview', icon: ICONS.overview },
  { id: 'api-key', label: 'API Key', icon: ICONS.api },
  { id: 'mcp-server', label: 'MCP Server', icon: ICONS.server },
  { id: 'opencode', label: 'OpenCode', icon: ICONS.code },
  { id: 'tools', label: 'Tools Reference', icon: ICONS.tools },
  { id: 'sdlc-roles', label: 'SDLC Roles', icon: ICONS.checklist },
  { id: 'role-management', label: 'Roles & Access', icon: ICONS.access },
  { id: 'kaede-architecture', label: 'Architecture & Roadmap', icon: ICONS.arch },
  { id: 'playbook-template', label: 'Playbook', icon: ICONS.playbook },
  { id: 'sponsorship', label: 'Sponsorship', icon: ICONS.money },
];

const PAGES_ID: PageEntry[] = [
  { id: 'index', label: 'Ikhtisar', icon: ICONS.overview },
  { id: 'api-key', label: 'API Key', icon: ICONS.api },
  { id: 'mcp-server', label: 'Server MCP', icon: ICONS.server },
  { id: 'opencode', label: 'OpenCode', icon: ICONS.code },
  { id: 'tools', label: 'Referensi Tools', icon: ICONS.tools },
  { id: 'sdlc-roles', label: 'Peran SDLC', icon: ICONS.checklist },
  { id: 'role-management', label: 'Manajemen Peran', icon: ICONS.access },
  { id: 'kaede-architecture', label: 'Arsitektur & Roadmap', icon: ICONS.arch },
  { id: 'playbook-template', label: 'Playbook', icon: ICONS.playbook },
  { id: 'sponsorship', label: 'Sponsor', icon: ICONS.money },
];

// ── Read markdown ──
function readDoc(lang: string, pageId: string): string | null {
  const base = lang === 'id' ? join(DOCS_DIR, 'id') : DOCS_DIR;
  const path = join(base, `${pageId}.md`);
  return existsSync(path) ? readFileSync(path, 'utf-8') : null;
}

// ── Markdown → HTML (rich transformations) ──
function renderMarkdown(content: string): string {
  return content
    // Fenced code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, langName, code) => {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<pre class="code-block"><code>' + escaped + '</code></pre>';
    })
    // Horizontal rules
    .replace(/^-{3,}\s*$/gm, '<hr>')
    // Headings
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    // Bold list items
    .replace(/^- \*\*(.+?)\*\*:\s*(.*)$/gm, '<li><strong>$1</strong>: $2</li>')
    // Regular list items
    .replace(/^- (.+)$/gm, '<li>$1</li>');
}

// ── Build sidebar HTML ──
function buildSidebar(pages: PageEntry[], currentPageId: string, lang: string): string {
  const sectionLabel = lang === 'id' ? 'Dokumentasi' : 'Documentation';
  const items = pages.map((p) => {
    const href = p.id === 'index' ? '.' : `${p.id}.html`;
    const isActive = p.id === currentPageId;
    const activeClass = isActive
      ? 'text-kaede-primary font-medium no-underline px-3 py-1.5 rounded-md bg-kaede-primary/10'
      : 'text-kaede-muted hover:text-kaede-text no-underline px-3 py-1.5 rounded-md hover:bg-kaede-surface transition-colors';
    return `<a href="${href}" class="${activeClass}">${p.label}</a>`;
  }).join('\n');

  return `
      <aside class="hidden lg:block w-56 shrink-0 self-start">
        <nav class="sticky top-16 flex flex-col gap-1 text-sm max-h-[calc(100vh-5rem)] overflow-y-auto">
          <span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-muted mb-2">${sectionLabel}</span>
          ${items}
        </nav>
      </aside>`;
}

// ── Build mobile bottom nav HTML ──
function buildMobileNav(pages: PageEntry[], currentPageId: string): string {
  const items = pages.map((p) => {
    const href = p.id === 'index' ? '.' : `${p.id}.html`;
    const isActive = p.id === currentPageId;
    const cls = isActive
      ? 'text-kaede-primary no-underline'
      : 'text-kaede-muted hover:text-kaede-text no-underline';
    return `<a href="${href}" class="flex flex-col items-center gap-0.5 ${cls}"><svg class="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${p.icon}"/></svg><span>${p.label}</span></a>`;
  }).join('\n');

  return `
  <!-- Mobile bottom nav -->
  <div class="lg:hidden fixed bottom-0 inset-x-0 border-t border-kaede-border/50 bg-kaede-bg/95 backdrop-blur-md z-50">
    <div class="flex items-center justify-around py-2 text-[10px] font-medium text-kaede-muted">
          ${items}
    </div>
  </div>`;
}

// ── Build prev/next navigation ──
function buildPrevNext(pages: PageEntry[], currentPageId: string): { prev: PageEntry | null; next: PageEntry | null } {
  const idx = pages.findIndex((p) => p.id === currentPageId);
  return {
    prev: idx > 0 ? pages[idx - 1] : null,
    next: idx < pages.length - 1 ? pages[idx + 1] : null,
  };
}

function buildPrevNextHtml(prev: PageEntry | null, next: PageEntry | null): string {
  const leftSvg = '<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>';
  const rightSvg = '<svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';

  const left = prev
    ? `<a href="${prev.id === 'index' ? '.' : prev.id + '.html'}" class="text-kaede-muted hover:text-kaede-primary no-underline flex items-center gap-1">${leftSvg} ${prev.label}</a>`
    : '<span></span>';
  const right = next
    ? `<a href="${next.id === 'index' ? '.' : next.id + '.html'}" class="text-kaede-muted hover:text-kaede-primary no-underline flex items-center gap-1">${next.label} ${rightSvg}</a>`
    : '<span></span>';

  return `\n        <div class="flex justify-between mt-6 text-sm">\n          ${left}\n          ${right}\n        </div>`;
}

// ── Build full HTML page ──
function buildHtml(lang: string, pageId: string, content: string, pages: PageEntry[]): string {
  const isId = lang === 'id';
  const currentLang = isId ? 'id' : 'en';

  const sidebar = buildSidebar(pages, pageId, lang);
  const mobileNav = buildMobileNav(pages, pageId);
  const { prev, next } = buildPrevNext(pages, pageId);
  const prevNext = buildPrevNextHtml(prev, next);

  // Breadcrumb for non-index pages
  const breadcrumb = pageId !== 'index'
    ? `<p class="text-sm text-kaede-muted flex items-center gap-2">
              <a href="." class="text-kaede-primary no-underline hover:underline">${isId ? 'Dokumentasi' : 'Documentation'}</a>
              <span>/</span>
              <span>${pages.find((p) => p.id === pageId)?.label || pageId}</span>
            </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="${currentLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isId ? 'Dokumentasi' : 'Documentation'} — KAEDE</title>
  <link rel="stylesheet" href="css/style.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="js/components.js"></script>
</head>
<body class="bg-kaede-bg text-kaede-text font-sans antialiased min-h-screen">
  <!-- Nav -->
  <kaede-navbar></kaede-navbar>

  <!-- Layout -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
    <div class="flex gap-8">
      ${sidebar}

      <!-- Content -->
      <main class="min-w-0 flex-1">
        <div class="glass rounded-2xl p-6 sm:p-10">
          <div class="prose">
            ${breadcrumb}
${content}
          </div>
        </div>
        ${prevNext}
      </main>
    </div>
  </div>

  ${mobileNav}

  <!-- Footer -->
  <div class="mb-16 lg:mb-0">
    <kaede-footer></kaede-footer>
  </div>
</body>
</html>`;
}

// ── Main ──
async function main(): Promise<void> {
  console.log('');

  // Ensure output directory exists
  mkdirSync(OUT_DIR, { recursive: true });

  // Copy CSS + append docs-only responsive utilities
  const cssPath = resolveCss();
  if (cssPath) {
    const cssOutDir = join(OUT_DIR, 'css');
    mkdirSync(cssOutDir, { recursive: true });
    const cssContent = readFileSync(cssPath, 'utf-8');

    // These utilities are used by docs template but not compiled into Power-Up CSS
    const docsOnlyUtilities = `
/* ── Docs-only responsive utilities (not in Power-Up build) ── */
@media (width>=64rem){.lg\\:block{display:block}.lg\\:flex{display:flex}.lg\\:hidden{display:none}}
.w-56{width:calc(var(--spacing)*56)}.top-16{top:calc(var(--spacing)*16)}
.mb-0{margin-bottom:0}.mb-16{margin-bottom:calc(var(--spacing)*16)}
.pt-24{padding-top:calc(var(--spacing)*24)}.pb-16{padding-bottom:calc(var(--spacing)*16)}
.mr-2{margin-right:calc(var(--spacing)*2)}
.p-4{padding:calc(var(--spacing)*4)}.p-10{padding:calc(var(--spacing)*10)}
.mt-1{margin-top:var(--spacing)}.mt-6{margin-top:calc(var(--spacing)*6)}
.ml-12{padding-left:calc(var(--spacing)*12)}
.gap-8{gap:calc(var(--spacing)*8)}
.self-start{align-self:flex-start}
.shrink-0{flex-shrink:0}
.inline-flex{display:inline-flex}.items-start{align-items:flex-start}
.justify-around{justify-content:space-around}
.truncate{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}
.max-h-\\[calc\\(100vh-5rem\\)\\]{max-height:calc(100vh - 5rem)}
.overflow-y-auto{overflow-y:auto}
.z-50{z-index:50}
`;
    writeFileSync(join(cssOutDir, 'style.css'), cssContent + docsOnlyUtilities, 'utf-8');
    console.log(`\x1b[36m  ✓\x1b[0m Copied css/style.css + docs utilities`);
  }

  // Copy components.js
  if (existsSync(COMPONENTS_SRC)) {
    const jsOutDir = join(OUT_DIR, 'js');
    mkdirSync(jsOutDir, { recursive: true });
    cpSync(COMPONENTS_SRC, join(jsOutDir, 'components.js'));
    console.log(`\x1b[36m  ✓\x1b[0m Copied js/components.js`);
  } else {
    console.warn('  \x1b[33m  ⚠ js/components.js not found — navbar/footer will not render\x1b[0m');
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
      const finalHtml = buildHtml(lang, page.id, html, pages);

      if (lang === 'id') {
        const outIdDir = join(OUT_DIR, 'id');
        mkdirSync(outIdDir, { recursive: true });
        writeFileSync(join(outIdDir, `${page.id}.html`), finalHtml, 'utf-8');
        console.log(
          `\x1b[36m  ✓\x1b[0m ID: ${page.label} \u2192 ${join(OUT_DIR, 'id', `${page.id}.html`).replace(WORKSPACE_ROOT, '.')}`,
        );
      } else {
        writeFileSync(join(OUT_DIR, `${page.id}.html`), finalHtml, 'utf-8');
        console.log(
          `\x1b[36m  ✓\x1b[0m EN: ${page.label} \u2192 ${join(OUT_DIR, `${page.id}.html`).replace(WORKSPACE_ROOT, '.')}`,
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
    const isId = lang === 'id';
    const outPath = suffix ? join(OUT_DIR, suffix, 'privacy.html') : join(OUT_DIR, 'privacy.html');

    const finalHtml = `<!DOCTYPE html>
<html lang="${isId ? 'id' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isId ? 'Kebijakan Privasi' : 'Privacy Policy'} — KAEDE</title>
  <link rel="stylesheet" href="css/style.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="js/components.js"></script>
</head>
<body class="bg-kaede-bg text-kaede-text font-sans antialiased min-h-screen">
  <kaede-navbar></kaede-navbar>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
    <div class="glass rounded-2xl p-6 sm:p-10">
      <div class="prose">
${html}
      </div>
    </div>
  </div>
  <div class="mb-12 lg:mb-0">
    <kaede-footer></kaede-footer>
  </div>
</body>
</html>`;
    writeFileSync(outPath, finalHtml, 'utf-8');
    console.log(`\x1b[36m  ✓\x1b[0m ${lang.toUpperCase()} privacy \u2192 ${outPath.replace(WORKSPACE_ROOT, '.')}`);
  }

  console.log(`\n  \x1b[32m  Done. Output in ${OUT_DIR.replace(WORKSPACE_ROOT, '.')}/\x1b[0m`);
}

main().catch((err: Error) => {
  console.error('  \x1b[31m  ✗ Build failed:\x1b[0m', err.message);
  process.exit(1);
});
