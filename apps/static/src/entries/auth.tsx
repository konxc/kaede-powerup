import { render } from 'solid-js/web';
import Auth from '../pages/auth';

const root = document.getElementById('app');
if (root) render(() => <Auth />, root);
