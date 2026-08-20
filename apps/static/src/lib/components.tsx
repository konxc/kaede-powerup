/**
 * KAEDE — Shared Navigation & Footer (SolidJS, Multilingual Support).
 *
 * Migrasi dari public/js/components.js (custom elements + AlpineJS) menjadi
 * komponen SolidJS dengan perilaku identik:
 *   - Navbar: logo, desktop links, mobile menu toggle, language switcher.
 *   - Footer: copyright, privacy policy, docs link.
 * Dipakai oleh halaman landing (index.html, id.html, privacy.html).
 */
import { createSignal, For, Show } from 'solid-js';

// Helper to calculate the toggle language URL dynamically
function getLanguageToggleUrl(currentLang: string): string {
  const loc = window.location;
  const path = loc.pathname;

  // Detect if we are on landing pages (Netlify / local root)
  const isLandingPage =
    path.endsWith('index.html') ||
    path.endsWith('id.html') ||
    path === '/' ||
    (!path.includes('dist-docs') &&
      !path.includes('docs') &&
      !path.includes('kaede-powerup') &&
      (path.endsWith('/') || path.split('/').pop()?.indexOf('.') === -1));

  if (isLandingPage) {
    if (currentLang === 'id') {
      // Switch to English: return index.html
      const newPath = path.replace('id.html', 'index.html');
      return (newPath.endsWith('/') ? newPath + 'index.html' : newPath) + loc.hash;
    } else {
      // Switch to Indonesian: return id.html
      const newPath = path.endsWith('index.html')
        ? path.replace('index.html', 'id.html')
        : path.endsWith('/')
          ? path + 'id.html'
          : path + '/id.html';
      return newPath + loc.hash;
    }
  }

  // Otherwise, we are on documentation pages (GitHub Pages docs / dist-docs)
  if (currentLang === 'id') {
    // Switch to English: remove '/id/' from path
    return path.replace('/id/', '/') + loc.hash;
  } else {
    // Switch to Indonesian: insert '/id/' before the filename
    const segments = path.split('/');
    const filename = segments.pop();
    // If filename is empty (meaning directory path like /docs/), we append id/
    if (filename === '') {
      return segments.join('/') + '/id/' + loc.hash;
    }
    return segments.join('/') + '/id/' + filename + loc.hash;
  }
}

// ── NAVBAR COMPONENT ──
export function Navbar() {
  // Determine language from HTML lang attribute, default to English
  const lang = document.documentElement.getAttribute('lang') || 'en';
  const isId = lang === 'id';

  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);

  const toggleUrl = getLanguageToggleUrl(lang);
  const toggleLabel = isId ? 'EN' : 'ID';

  // Localized labels
  const labels = isId
    ? {
        tentang: 'Tentang',
        ekosistem: 'Ekosistem',
        openkb: 'OpenKB',
        playbook: 'Playbook',
        opencode: 'OpenCode',
        alur: 'Alur Kerja',
        panduan: 'Power-Up',
        dokumentasi: 'Dokumentasi',
        toggleLang: 'English',
      }
    : {
        tentang: 'About',
        ekosistem: 'Ecosystem',
        openkb: 'OpenKB',
        playbook: 'Playbook',
        opencode: 'OpenCode',
        alur: 'Workflow',
        panduan: 'Power-Up',
        dokumentasi: 'Docs',
        toggleLang: 'Bahasa Indonesia',
      };

  // Paths
  const baseLanding = isId ? 'https://kaede-powerup.netlify.app/id.html' : 'https://kaede-powerup.netlify.app/';
  const baseDocs = isId ? 'https://konxc.github.io/kaede-powerup/id/' : 'https://konxc.github.io/kaede-powerup/';

  const navLinks = [
    { href: baseLanding + '#tentang', label: labels.tentang },
    { href: baseLanding + '#ekosistem', label: labels.ekosistem },
    { href: baseLanding + '#openkb', label: labels.openkb },
    { href: baseLanding + '#playbook', label: labels.playbook },
    { href: baseLanding + '#opencode', label: labels.opencode },
    { href: baseLanding + '#alur', label: labels.alur },
    { href: baseLanding + '#panduan', label: labels.panduan },
    { href: baseDocs, label: labels.dokumentasi },
  ];

  return (
    <nav class="nav-blur fixed top-0 inset-x-0 z-50 border-b border-kaede-border/50">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <a href={baseLanding} class="flex items-center gap-2 no-underline">
          <span class="flex items-center justify-center size-7 rounded-md bg-kaede-primary text-white text-xs font-bold">K</span>
          <span class="font-semibold text-sm tracking-wide text-kaede-text">KAEDE</span>
        </a>

        {/* Desktop Nav Links */}
        <div class="hidden lg:flex items-center gap-6 text-xs font-medium text-kaede-muted">
          <For each={navLinks}>
            {(link) => (
              <a href={link.href} class="hover:text-kaede-primary transition-colors no-underline">
                {link.label}
              </a>
            )}
          </For>

          {/* Language Switcher */}
          <a
            href={toggleUrl}
            class="flex items-center gap-1 px-2 py-0.5 rounded border border-kaede-border hover:border-kaede-primary hover:text-kaede-primary transition-colors no-underline text-[10px] font-bold text-kaede-text uppercase"
            title={labels.toggleLang}
          >
            {toggleLabel}
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen((o) => !o)}
          type="button"
          class="lg:hidden flex items-center justify-center size-8 rounded-md text-kaede-muted hover:text-kaede-text hover:bg-kaede-surface transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <Show when={!mobileMenuOpen()} fallback={<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />}>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </Show>
          </svg>
        </button>
      </div>

      {/* Mobile Nav Menu */}
      <Show when={mobileMenuOpen()}>
        <div class="lg:hidden border-t border-kaede-border/50 px-4 py-3 flex flex-col gap-2 text-sm bg-kaede-bg/95 backdrop-blur-md">
          <For each={navLinks}>
            {(link) => (
              <a
                onClick={() => setMobileMenuOpen(false)}
                href={link.href}
                class="text-kaede-muted hover:text-kaede-primary no-underline py-1"
              >
                {link.label}
              </a>
            )}
          </For>

          {/* Mobile Language Switcher */}
          <a
            href={toggleUrl}
            class="flex items-center justify-center gap-1.5 px-3 py-2 mt-1.5 rounded bg-kaede-surface border border-kaede-border hover:border-kaede-primary hover:text-kaede-primary transition-colors no-underline text-xs font-bold text-kaede-text uppercase"
          >
            🌐 {labels.toggleLang}
          </a>
        </div>
      </Show>
    </nav>
  );
}

// ── FOOTER COMPONENT ──
export function Footer() {
  const lang = document.documentElement.getAttribute('lang') || 'en';
  const isId = lang === 'id';

  const baseLanding = isId ? 'https://kaede-powerup.netlify.app/id.html' : 'https://kaede-powerup.netlify.app/';
  const baseDocs = isId ? 'https://konxc.github.io/kaede-powerup/id/' : 'https://konxc.github.io/kaede-powerup/';

  const copyright = isId
    ? '© 2026 PT Koneksi Jaringan Indonesia. Hak cipta dilindungi undang-undang.'
    : '© 2026 PT Koneksi Jaringan Indonesia. All rights reserved.';

  const privacyLabel = isId ? 'Kebijakan Privasi' : 'Privacy Policy';
  const docsLabel = isId ? 'Dokumentasi' : 'Documentation';

  return (
    <footer class="border-t border-kaede-border/50 py-8 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-kaede-muted">
        <div class="flex items-center gap-3">
          <span class="flex items-center justify-center size-6 rounded bg-kaede-primary text-white text-[9px] font-bold">K</span>
          <span>{copyright}</span>
        </div>
        <div class="flex items-center gap-4">
          <a href={baseLanding + 'privacy.html'} class="hover:text-kaede-primary no-underline transition-colors">
            {privacyLabel}
          </a>
          <span>&middot;</span>
          <a href={baseDocs} class="hover:text-kaede-primary no-underline transition-colors">
            {docsLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}
