/**
 * KAEDE — Custom Reusable Web Components (Multilingual Support)
 * Shared navbar and footer for Netlify Landing page and GitHub Pages Docs.
 */

// Helper to calculate the toggle language URL dynamically
function getLanguageToggleUrl(currentLang) {
  const loc = window.location;
  const path = loc.pathname;
  
  // Detect if we are on landing pages (Netlify / local root)
  const isLandingPage = path.endsWith('index.html') || 
                        path.endsWith('id.html') || 
                        path === '/' || 
                        (!path.includes('dist-docs') && !path.includes('docs') && !path.includes('kaede-powerup') && (path.endsWith('/') || path.split('/').pop().indexOf('.') === -1));

  if (isLandingPage) {
    if (currentLang === 'id') {
      // Switch to English: return index.html
      const newPath = path.replace('id.html', 'index.html');
      return (newPath.endsWith('/') ? newPath + 'index.html' : newPath) + loc.hash;
    } else {
      // Switch to Indonesian: return id.html
      const newPath = path.endsWith('index.html') ? path.replace('index.html', 'id.html') : (path.endsWith('/') ? path + 'id.html' : path + '/id.html');
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
class KaedeNavbar extends HTMLElement {
  connectedCallback() {
    // Determine language from HTML lang attribute, default to English
    const lang = document.documentElement.getAttribute('lang') || 'en';
    const isId = lang === 'id';
    
    const toggleUrl = getLanguageToggleUrl(lang);
    const toggleLabel = isId ? 'EN' : 'ID';

    // Localized labels
    const labels = isId ? {
      tentang: 'Tentang',
      ekosistem: 'Ekosistem',
      openkb: 'OpenKB',
      playbook: 'Playbook',
      opencode: 'OpenCode',
      alur: 'Alur Kerja',
      panduan: 'Power-Up',
      dokumentasi: 'Dokumentasi',
      toggleLang: 'English'
    } : {
      tentang: 'About',
      ekosistem: 'Ecosystem',
      openkb: 'OpenKB',
      playbook: 'Playbook',
      opencode: 'OpenCode',
      alur: 'Workflow',
      panduan: 'Power-Up',
      dokumentasi: 'Docs',
      toggleLang: 'Bahasa Indonesia'
    };

    // Paths
    const baseLanding = isId ? 'https://kaede-powerup.netlify.app/id.html' : 'https://kaede-powerup.netlify.app/';
    const baseDocs = isId ? 'https://konxc.github.io/kaede-powerup/id/' : 'https://konxc.github.io/kaede-powerup/';

    this.innerHTML = `
      <nav x-data="{ mobileMenuOpen: false }" class="nav-blur fixed top-0 inset-x-0 z-50 border-b border-kaede-border/50">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <a href="${baseLanding}" class="flex items-center gap-2 no-underline">
            <span class="flex items-center justify-center size-7 rounded-md bg-kaede-primary text-white text-xs font-bold">K</span>
            <span class="font-semibold text-sm tracking-wide text-kaede-text">KAEDE</span>
          </a>
          
          <!-- Desktop Nav Links -->
          <div class="hidden lg:flex items-center gap-6 text-xs font-medium text-kaede-muted">
            <a href="${baseLanding}#tentang" class="hover:text-kaede-primary transition-colors no-underline">${labels.tentang}</a>
            <a href="${baseLanding}#ekosistem" class="hover:text-kaede-primary transition-colors no-underline">${labels.ekosistem}</a>
            <a href="${baseLanding}#openkb" class="hover:text-kaede-primary transition-colors no-underline">${labels.openkb}</a>
            <a href="${baseLanding}#playbook" class="hover:text-kaede-primary transition-colors no-underline">${labels.playbook}</a>
            <a href="${baseLanding}#opencode" class="hover:text-kaede-primary transition-colors no-underline">${labels.opencode}</a>
            <a href="${baseLanding}#alur" class="hover:text-kaede-primary transition-colors no-underline">${labels.alur}</a>
            <a href="${baseLanding}#panduan" class="hover:text-kaede-primary transition-colors no-underline">${labels.panduan}</a>
            <a href="${baseDocs}" class="hover:text-kaede-primary transition-colors no-underline">${labels.dokumentasi}</a>
            
            <!-- Language Switcher -->
            <a href="${toggleUrl}" class="flex items-center gap-1 px-2 py-0.5 rounded border border-kaede-border hover:border-kaede-primary hover:text-kaede-primary transition-colors no-underline text-[10px] font-bold text-kaede-text uppercase" title="${labels.toggleLang}">
              ${toggleLabel}
            </a>
          </div>

          <!-- Mobile Menu Toggle Button -->
          <button @click="mobileMenuOpen = !mobileMenuOpen" type="button" class="lg:hidden flex items-center justify-center size-8 rounded-md text-kaede-muted hover:text-kaede-text hover:bg-kaede-surface transition-colors cursor-pointer" aria-label="Toggle menu">
            <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path x-show="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              <path x-show="mobileMenuOpen" x-cloak stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Mobile Nav Menu -->
        <div x-show="mobileMenuOpen" 
             x-cloak 
             x-transition:enter="transition ease-out duration-200" 
             x-transition:enter-start="opacity-0 -translate-y-4" 
             x-transition:enter-end="opacity-100 translate-y-0" 
             x-transition:leave="transition ease-in duration-150" 
             x-transition:leave-start="opacity-100 translate-y-0" 
             x-transition:leave-end="opacity-0 -translate-y-4" 
             class="lg:hidden border-t border-kaede-border/50 px-4 py-3 flex flex-col gap-2 text-sm bg-kaede-bg/95 backdrop-blur-md">
          <a @click="mobileMenuOpen = false" href="${baseLanding}#tentang" class="text-kaede-muted hover:text-kaede-primary no-underline py-1">${labels.tentang}</a>
          <a @click="mobileMenuOpen = false" href="${baseLanding}#ekosistem" class="text-kaede-muted hover:text-kaede-primary no-underline py-1">${labels.ekosistem}</a>
          <a @click="mobileMenuOpen = false" href="${baseLanding}#openkb" class="text-kaede-muted hover:text-kaede-primary no-underline py-1">${labels.openkb}</a>
          <a @click="mobileMenuOpen = false" href="${baseLanding}#playbook" class="text-kaede-muted hover:text-kaede-primary no-underline py-1">${labels.playbook}</a>
          <a @click="mobileMenuOpen = false" href="${baseLanding}#opencode" class="text-kaede-muted hover:text-kaede-primary no-underline py-1">${labels.opencode}</a>
          <a @click="mobileMenuOpen = false" href="${baseLanding}#alur" class="text-kaede-muted hover:text-kaede-primary no-underline py-1">${labels.alur}</a>
          <a @click="mobileMenuOpen = false" href="${baseLanding}#panduan" class="text-kaede-muted hover:text-kaede-primary no-underline py-1">${labels.panduan}</a>
          <a @click="mobileMenuOpen = false" href="${baseDocs}" class="text-kaede-muted hover:text-kaede-primary no-underline py-1">${labels.dokumentasi}</a>
          
          <!-- Mobile Language Switcher -->
          <a href="${toggleUrl}" class="flex items-center justify-center gap-1.5 px-3 py-2 mt-1.5 rounded bg-kaede-surface border border-kaede-border hover:border-kaede-primary hover:text-kaede-primary transition-colors no-underline text-xs font-bold text-kaede-text uppercase">
            🌐 ${labels.toggleLang}
          </a>
        </div>
      </nav>
    `;
  }
}
customElements.define('kaede-navbar', KaedeNavbar);

// ── FOOTER COMPONENT ──
class KaedeFooter extends HTMLElement {
  connectedCallback() {
    const lang = document.documentElement.getAttribute('lang') || 'en';
    const isId = lang === 'id';

    const baseLanding = isId ? 'https://kaede-powerup.netlify.app/id.html' : 'https://kaede-powerup.netlify.app/';
    const baseDocs = isId ? 'https://konxc.github.io/kaede-powerup/id/' : 'https://konxc.github.io/kaede-powerup/';

    const copyright = isId 
      ? '&copy; 2026 PT Koneksi Jaringan Indonesia. Hak cipta dilindungi undang-undang.'
      : '&copy; 2026 PT Koneksi Jaringan Indonesia. All rights reserved.';

    const privacyLabel = isId ? 'Kebijakan Privasi' : 'Privacy Policy';
    const docsLabel = isId ? 'Dokumentasi' : 'Documentation';

    this.innerHTML = `
      <footer class="border-t border-kaede-border/50 py-8 px-4 sm:px-6">
        <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-kaede-muted">
          <div class="flex items-center gap-3">
            <span class="flex items-center justify-center size-6 rounded bg-kaede-primary text-white text-[9px] font-bold">K</span>
            <span>${copyright}</span>
          </div>
          <div class="flex items-center gap-4">
            <a href="${baseLanding}privacy.html" class="hover:text-kaede-primary no-underline transition-colors">${privacyLabel}</a>
            <span>&middot;</span>
            <a href="${baseDocs}" class="hover:text-kaede-primary no-underline transition-colors">${docsLabel}</a>
          </div>
        </div>
      </footer>
    `;
  }
}
customElements.define('kaede-footer', KaedeFooter);
