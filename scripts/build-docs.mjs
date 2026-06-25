/**
 * Build docs: Markdown → HTML (KAEDE theme)
 *
 * Reads docs/*.md, renders to HTML with full KAEDE layout,
 * outputs to dist-docs/ for GitHub Pages (gh-pages branch).
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
// Prefer compiled Tailwind CSS (public/css/style.css), fallback to source (src/style.css)
function resolveCss() {
  const compiledPath = join(ROOT, 'public', 'css', 'style.css');
  if (existsSync(compiledPath)) return compiledPath;

  const srcPath = join(ROOT, 'src', 'style.css');
  if (existsSync(srcPath)) {
    console.warn('⚠ public/css/style.css not found — using src/style.css (uncompiled Tailwind directives may render incorrectly)');
    return srcPath;
  }

  console.warn('⚠ No CSS found — documentation will render without styling');
  return null;
}

// ── Page registry ──
// Order here determines sidebar, prev/next nav, and mobile nav
const PAGES = [
  { id: 'index',      label: 'Ikhtisar',          icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'api-key',    label: 'API Key',           icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
  { id: 'mcp-server', label: 'MCP Server',        icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01' },
  { id: 'opencode',   label: 'OpenCode',          icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { id: 'tools',          label: 'Referensi Tools',   icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { id: 'role-management', label: 'Role Management', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
  { id: 'kaede-architecture', label: 'Arsitektur & Roadmap', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'playbook-template', label: 'Template Playbook', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
];

const PAGE_IDS = PAGES.map(p => p.id);
const MOBILE_ICONS = {
  'index': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
  'api-key': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>',
  'mcp-server': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>',
  'opencode': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>',
  'tools': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>',
  'role-management': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>',
  'kaede-architecture': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
  'playbook-template': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>',
};

// ── Template ──
function pageTemplate({ title, contentHtml, currentId }) {
  const currentIdx = PAGE_IDS.indexOf(currentId);
  const prevPage = currentIdx > 0 ? PAGES[currentIdx - 1] : null;
  const nextPage = currentIdx < PAGES.length - 1 ? PAGES[currentIdx + 1] : null;

  // Sidebar links
  const sidebarLinks = PAGES.map(p => {
    const isActive = p.id === currentId;
      return `          <a href="${p.id === 'index' ? '.' : p.id + '.html'}" class="${isActive ? 'text-kaede-primary font-medium no-underline px-3 py-1.5 rounded-md bg-kaede-primary/10' : 'text-kaede-muted hover:text-kaede-text no-underline px-3 py-1.5 rounded-md hover:bg-kaede-surface transition-colors'}">${p.label}</a>`;
  }).join('\n');

  // Breadcrumb
  const breadcrumb = currentId === 'index'
    ? ''
    : `            <p class="text-sm text-kaede-muted flex items-center gap-2">
              <a href="." class="text-kaede-primary no-underline hover:underline">Dokumentasi</a>
              <span>/</span>
              <span>${PAGES.find(p => p.id === currentId).label}</span>
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
  const mobileNav = PAGES.map(p => {
    const isActive = p.id === currentId;
    return `          <a href="${p.id === 'index' ? '.' : p.id + '.html'}" class="flex flex-col items-center gap-0.5 ${isActive ? 'text-kaede-primary' : 'text-kaede-muted hover:text-kaede-text'} no-underline"><svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">${MOBILE_ICONS[p.id]}</svg><span>${p.label}</span></a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body class="bg-kaede-bg text-kaede-text font-sans antialiased min-h-screen">
  <!-- Nav -->
  <nav class="nav-blur fixed top-0 inset-x-0 z-50 border-b border-kaede-border/50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
      <a href="." class="flex items-center gap-2 no-underline">
        <span class="flex items-center justify-center size-7 rounded-md bg-kaede-primary text-white text-xs font-bold">K</span>
        <span class="font-semibold text-sm tracking-wide">KAEDE</span>
      </a>
      <div class="flex items-center gap-6 text-xs font-medium text-kaede-muted">
        <a href="." class="hover:text-kaede-primary transition-colors no-underline">Beranda</a>
        <a href="." class="text-kaede-primary no-underline">Dokumentasi</a>
        <a href="privacy.html" class="hover:text-kaede-primary transition-colors no-underline">Privacy</a>
      </div>
    </div>
  </nav>

  <!-- Layout -->
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
    <div class="flex gap-8">
      <!-- Sidebar -->
      <aside class="hidden lg:block w-56 shrink-0">
        <nav class="sticky top-20 flex flex-col gap-1 text-sm">
          <span class="text-[10px] font-semibold tracking-[0.2em] uppercase text-kaede-muted mb-2">Dokumentasi</span>
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

  <footer class="border-t border-kaede-border/50 py-6 px-4 sm:px-6 mb-12 lg:mb-0">
    <div class="max-w-6xl mx-auto text-center text-xs text-kaede-muted">
      &copy; 2026 PT Koneksi Jaringan Indonesia &middot; <a href="privacy.html" class="hover:text-kaede-text no-underline">Privacy</a>
    </div>
  </footer>
</body>
</html>`;
}

// ── Privacy page template (standalone, no sidebar) ──
function privacyTemplate({ title, contentHtml }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body class="bg-kaede-bg text-kaede-text font-sans antialiased min-h-screen">
  <nav class="nav-blur fixed top-0 inset-x-0 z-50 border-b border-kaede-border/50">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
      <a href="." class="flex items-center gap-2 no-underline">
        <span class="flex items-center justify-center size-7 rounded-md bg-kaede-primary text-white text-xs font-bold">K</span>
        <span class="font-semibold text-sm tracking-wide">KAEDE</span>
      </a>
      <div class="flex items-center gap-6 text-xs font-medium text-kaede-muted">
        <a href="." class="hover:text-kaede-primary transition-colors no-underline">Beranda</a>
        <a href="." class="hover:text-kaede-primary transition-colors no-underline">Dokumentasi</a>
        <a href="privacy.html" class="text-kaede-primary no-underline">Privacy</a>
      </div>
    </div>
  </nav>

  <div class="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
    <main class="min-w-0 flex-1">
      <div class="glass rounded-2xl p-6 sm:p-10">
        <div class="prose">
${contentHtml}
        </div>
      </div>
    </main>
  </div>

  <footer class="border-t border-kaede-border/50 py-6 px-4 sm:px-6">
    <div class="max-w-6xl mx-auto text-center text-xs text-kaede-muted">
      &copy; 2026 PT Koneksi Jaringan Indonesia &middot; <a href="privacy.html" class="hover:text-kaede-text no-underline">Privacy</a>
    </div>
  </footer>
</body>
</html>`;
}

// ── Main ──
async function main() {
  // Ensure output dir
  mkdirSync(join(OUT_DIR, 'css'), { recursive: true });

  // Copy CSS (try compiled first, fallback to source)
  const cssPath = resolveCss();
  if (cssPath) {
    cpSync(cssPath, join(OUT_DIR, 'css', 'style.css'));
    console.log(`✓ Copied css/style.css from ${cssPath.replace(ROOT, '.')}`);
  } else {
    console.warn('⚠ No CSS source found — documentation will render unstyled');
  }

  // Dynamically import marked
  const { marked } = await import('marked');

  // Configure marked
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Build navigation pages
  for (const page of PAGES) {
    const mdPath = join(DOCS_DIR, `${page.id}.md`);
    if (!existsSync(mdPath)) {
      console.warn(`⚠ Missing: ${mdPath}`);
      continue;
    }

    const md = readFileSync(mdPath, 'utf-8');
    const htmlContent = await marked.parse(md);
    const html = pageTemplate({
      title: page.title || `Dokumentasi — KAEDE`,
      contentHtml: htmlContent,
      currentId: page.id,
    });

    const outPath = join(OUT_DIR, page.id === 'index' ? 'index.html' : `${page.id}.html`);
    writeFileSync(outPath, html, 'utf-8');
    console.log(`✓ ${page.id} → ${outPath}`);
  }

  // Build privacy page (if exists)
  const privacyMd = join(DOCS_DIR, 'privacy.md');
  if (existsSync(privacyMd)) {
    const md = readFileSync(privacyMd, 'utf-8');
    const htmlContent = await marked.parse(md);
    const html = privacyTemplate({
      title: 'Kebijakan Privasi — KAEDE',
      contentHtml: htmlContent,
    });
    writeFileSync(join(OUT_DIR, 'privacy.html'), html, 'utf-8');
    console.log('✓ privacy → privacy.html');
  }

  console.log('\nDone. Output in dist-docs/');
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
