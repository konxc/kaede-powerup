import { render } from 'solid-js/web';
import SetEnvironment from '../pages/card';

const root = document.getElementById('app');
if (root) render(() => <SetEnvironment />, root);
