/**
 * Build docs: Markdown → HTML (KAEDE theme with Multilingual Support)
 *
 * Reads docs/*.md and docs/id/*.md, renders them to HTML,
 * outputs to dist-docs/ and dist-docs/id/ for GitHub Pages.
 *
 * Usage: node scripts/build-docs.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DOCS_DIR = join(ROOT, 'docs');
const OUT_DIR = join(ROOT, 'dist-docs');

// ── CSS source resolution ──
function resolveCss() {
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
  { id: 'opencode', label: 'OpenCode', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  {
    id: 'tools',
    label: 'Tools Reference',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  },
  {
    id: 'sdlc-roles',
    label: 'SDLC Roles',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4l2 3m0 0l3-3m-3 3v6',
  },
  {
    id: 'role-management',
    label: 'Roles & Access',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  },
  {
    id: 'kaede-architecture',
    label: 'Architecture & Roadmap',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'playbook-template',
    label: 'Playbook Template',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    id: 'sponsorship',
    label: 'Sponsorship',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
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
    label: 'API Key & Token',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  },
  {
    id: 'mcp-server',
    label: 'MCP Server',
    icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
  },
  { id: 'opencode', label: 'OpenCode', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  {
    id: 'tools',
    label: 'Referensi Tools',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  },
  {
    id: 'sdlc-roles',
    label: 'Peran SDLC',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4l2 3m0 0l3-3m-3 3v6',
  },
  {
    id: 'role-management',
    label: 'Peran & Akses',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  },
  {
    id: 'kaede-architecture',
    label: 'Arsitektur & Roadmap',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'playbook-template',
    label: 'Template Playbook',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    id: 'sponsorship',
    label: 'Sponsor',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
];

const MOBILE_ICONS = {
  index:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
  'api-key':
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>',
  'mcp-server':
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>',
  opencode:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>',
  tools:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>',
  'sdlc-roles':
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4l2 3m0 0l3-3m-3 3v6"/>',
  'role-management':
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>',
  'kaede-architecture':
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
  'playbook-template':
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>',
  sponsorship:
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>',
};

// ── Template ──
function pageTemplate({ title, contentHtml, currentId, lang }) {
  const pages = lang === 'id' ? PAGES_ID : PAGES_EN;
  const pageIds = pages.map((p) => p.id);

  const currentIdx = pageIds.indexOf(currentId);
  const prevPage = currentIdx > 0 ? pages[currentIdx - 1] : null;
  const nextPage = currentIdx < pages.length - 1 ? pages[currentIdx + 1] : null;

  // Sidebar links
  const sidebarLinks = pages
    .map((p) => {
      const isActive = p.id === currentId;
      return `          <a href="${p.id === 'index' ? '.' : p.id + '.html'}" class="${isActive ? 'text-kaede-primary font-medium no-underline px-3 py-1.5 rounded-md bg-kaede-primary/10' : 'text-kaede-muted hover:text-kaede-text no-underline px-3 py-1.5 rounded-md hover:bg-kaede-surface transition-colors'}">${p.label}</a>`;
    })
    .join('\n');

  // Breadcrumb
  const docsTitle = lang === 'id' ? 'Dokumentasi' : 'Documentation';
  const breadcrumb =
    currentId === 'index'
      ? ''
      : `            <p class="text-sm text-kaede-muted flex items-center gap-2">
              <a href="." class="text-kaede-primary no-underline hover:underline">${docsTitle}</a>
              <span>/</span>
              <span>${pages.find((p) => p.id === currentId).label}</span>
            </p>`;

  // Prev/next navigation
  const prevNav = prevPage
    ? `          <a href="${prevPage.id === 'index' ? '.' : prevPage.id + '.html'}" class="text-kaede-muted hover:text-kaede-primary no-underline flex items-center gap-1">
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            ${prevPage.label}
          </a>`
    : '          <span></span>';

  const nextNav = nextPage
    ? `          <a href="${nextPage.id}.html" class="text-kaede-muted hover:text-kaede-primary no-underline flex items-center gap-1">
            ${nextPage.label}
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>`
    : '          <span></span>';

  // Mobile bottom nav
  const mobileNav = pages
    .map((p) => {
      const isActive = p.id === currentId;
      return `          <a href="${p.id === 'index' ? '.' : p.id + '.html'}" class="flex flex-col items-center gap-0.5 ${isActive ? 'text-kaede-primary' : 'text-kaede-muted hover:text-kaede-text'} no-underline"><svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">${MOBILE_ICONS[p.id]}</svg><span>${p.label}</span></a>`;
    })
    .join('\n');

  // Relative path prefix for CSS & JS based on whether we are in id/ folder
  const baseRel = lang === 'id' ? '../' : '';
  const sidebarSectionLabel = lang === 'id' ? 'Dokumentasi' : 'Documentation';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="${baseRel}css/style.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="${baseRel}js/components.js"></script>
</head>
<body class="bg-kaede-bg text-kaede-text font-sans antialiased min-h-screen">
  <!-- Nav -->
  <kaede-navbar></kaede-navbar>

  <!-- Layout -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
    <div class="flex gap-8">
      <!-- Sidebar -->
      <aside class="hidden lg:block w-56 shrink-0">
        <nav class="sticky top-20 flex flex-col gap-1 text-sm">
          <span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-muted mb-2">${sidebarSectionLabel}</span>
${sidebarLinks}
        </nav>
      </aside>

      <!-- Content -->
      <main class="min-w-0 flex-1">
        <div class="glass rounded-2xl p-6 sm:p-10">
          <div class="prose">
${breadcrumb}
${contentHtml}
          </div>
        </div>

        <div class="flex justify-between mt-6 text-sm">
${prevNav}
${nextNav}
        </div>
      </main>
    </div>
  </div>

  <!-- Mobile bottom nav -->
  <div class="lg:hidden fixed bottom-0 inset-x-0 border-t border-kaede-border/50 bg-kaede-bg/95 backdrop-blur-md">
    <div class="flex items-center justify-around py-2 text-[10px] font-medium text-kaede-muted">
${mobileNav}
    </div>
  </div>

  <!-- Footer -->
  <div class="mb-12 lg:mb-0">
    <kaede-footer></kaede-footer>
  </div>
</body>
</html>`;
}

// ── Privacy page template (standalone, no sidebar) ──
function privacyTemplate({ title, contentHtml, lang }) {
  const baseRel = lang === 'id' ? '../' : '';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="${baseRel}css/style.css" />
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="${baseRel}js/components.js"></script>
</head>
<body class="bg-kaede-bg text-kaede-text font-sans antialiased min-h-screen">
  <!-- Nav -->
  <kaede-navbar></kaede-navbar>

  <div class="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
    <main class="min-w-0 flex-1">
      <div class="glass rounded-2xl p-6 sm:p-10">
        <div class="prose">
${contentHtml}
        </div>
      </div>
    </main>
  </div>

  <!-- Footer -->
  <kaede-footer></kaede-footer>
</body>
</html>`;
}

// ── Main ──
async function main() {
  // Ensure output dirs
  mkdirSync(join(OUT_DIR, 'css'), { recursive: true });
  mkdirSync(join(OUT_DIR, 'js'), { recursive: true });
  mkdirSync(join(OUT_DIR, 'id'), { recursive: true });

  // Copy CSS (try compiled first, fallback to source)
  const cssPath = resolveCss();
  if (cssPath) {
    cpSync(cssPath, join(OUT_DIR, 'css', 'style.css'));
    console.log(`✓ Copied css/style.css from ${cssPath.replace(ROOT, '.')}`);
  } else {
    console.warn('⚠ No CSS source found — documentation will render unstyled');
  }

  // Copy Components JS
  const jsPath = join(ROOT, 'public', 'js', 'components.js');
  if (existsSync(jsPath)) {
    cpSync(jsPath, join(OUT_DIR, 'js', 'components.js'));
    console.log(`✓ Copied js/components.js from ${jsPath.replace(ROOT, '.')}`);
  } else {
    console.warn('⚠ No public/js/components.js found');
  }

  // Dynamically import marked
  const { marked } = await import('marked');

  // Configure marked
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // 1. Build English navigation pages (default)
  for (const page of PAGES_EN) {
    const mdPath = join(DOCS_DIR, `${page.id}.md`);
    if (!existsSync(mdPath)) {
      console.warn(`⚠ Missing EN: ${mdPath}`);
      continue;
    }

    const md = readFileSync(mdPath, 'utf-8');
    const htmlContent = await marked.parse(md);
    const html = pageTemplate({
      title: page.title || `Documentation — KAEDE`,
      contentHtml: htmlContent,
      currentId: page.id,
      lang: 'en',
    });

    const outPath = join(OUT_DIR, page.id === 'index' ? 'index.html' : `${page.id}.html`);
    writeFileSync(outPath, html, 'utf-8');
    console.log(`✓ EN: ${page.id} → ${outPath}`);
  }

  // 2. Build Indonesian navigation pages (id/)
  for (const page of PAGES_ID) {
    const mdPath = join(DOCS_DIR, 'id', `${page.id}.md`);
    if (!existsSync(mdPath)) {
      console.warn(`⚠ Missing ID: ${mdPath}`);
      continue;
    }

    const md = readFileSync(mdPath, 'utf-8');
    const htmlContent = await marked.parse(md);
    const html = pageTemplate({
      title: page.title || `Dokumentasi — KAEDE`,
      contentHtml: htmlContent,
      currentId: page.id,
      lang: 'id',
    });

    const outPath = join(OUT_DIR, 'id', page.id === 'index' ? 'index.html' : `${page.id}.html`);
    writeFileSync(outPath, html, 'utf-8');
    console.log(`✓ ID: ${page.id} → ${outPath}`);
  }

  // 3. Build English privacy page (if exists)
  const privacyMd = join(DOCS_DIR, 'privacy.md');
  if (existsSync(privacyMd)) {
    const md = readFileSync(privacyMd, 'utf-8');
    const htmlContent = await marked.parse(md);
    const html = privacyTemplate({
      title: 'Privacy Policy — KAEDE',
      contentHtml: htmlContent,
      lang: 'en',
    });
    writeFileSync(join(OUT_DIR, 'privacy.html'), html, 'utf-8');
    console.log('✓ EN privacy → privacy.html');
  }

  // 4. Build Indonesian privacy page (if exists)
  const privacyMdId = join(DOCS_DIR, 'id', 'privacy.md');
  if (existsSync(privacyMdId)) {
    const md = readFileSync(privacyMdId, 'utf-8');
    const htmlContent = await marked.parse(md);
    const html = privacyTemplate({
      title: 'Kebijakan Privasi — KAEDE',
      contentHtml: htmlContent,
      lang: 'id',
    });
    writeFileSync(join(OUT_DIR, 'id', 'privacy.html'), html, 'utf-8');
    console.log('✓ ID privacy → id/privacy.html');
  }

  console.log('\nDone. Output in dist-docs/');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
