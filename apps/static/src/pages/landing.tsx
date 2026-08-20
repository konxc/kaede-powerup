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
