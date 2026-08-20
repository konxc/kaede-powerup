import { render } from 'solid-js/web';
import Connect from '../pages/connect';

const root = document.getElementById('app');
if (root) render(() => <Connect />, root);
