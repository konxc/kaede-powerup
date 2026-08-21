/**
 * KAEDE — Landing page shell (SolidJS)
 *
 * Merender Navbar + Footer ke placeholder halaman landing (index.html / id.html)
 * dan memuat konektor iframe Trello (kaede.ts). Konten statis halaman tetap
 * berupa HTML di file entry masing-masing.
 */
import { render } from 'solid-js/web';
import { Navbar, Footer } from '../lib/components';
import '../lib/kaede';

const navbarRoot = document.getElementById('kaede-navbar');
if (navbarRoot) render(() => <Navbar />, navbarRoot);

const footerRoot = document.getElementById('kaede-footer');
if (footerRoot) render(() => <Footer />, footerRoot);

// ── Handling Iframe vs Standalone Site Mode & Scroll Effects ──
if (typeof window !== 'undefined') {
  const isIframe = window.self !== window.top;
  const iframeRoot = document.getElementById('kaede-iframe');
  const siteRoot = document.getElementById('kaede-site');

  if (isIframe) {
    if (iframeRoot) {
      iframeRoot.classList.remove('hidden');
      iframeRoot.classList.add('flex');
    }
    if (siteRoot) {
      siteRoot.classList.add('hidden');
    }
  } else {
    if (iframeRoot) {
      iframeRoot.classList.add('hidden');
    }
    if (siteRoot) {
      siteRoot.classList.remove('hidden');
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll('.fade-in').forEach((el) => {
        observer.observe(el);
      });
    }
  }
}
