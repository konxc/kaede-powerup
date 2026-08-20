/**
 * KAEDE — Privacy Policy shell (SolidJS)
 *
 * Merender Footer ke placeholder privacy.html. Halaman ini tidak memuat
 * konektor iframe Trello (halaman publik).
 */
import { render } from 'solid-js/web';
import { Footer } from '../lib/components';

const footerRoot = document.getElementById('kaede-footer');
if (footerRoot) render(() => <Footer />, footerRoot);
