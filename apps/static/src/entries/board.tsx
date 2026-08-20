import { render } from 'solid-js/web';
import BoardDashboard from '../pages/board';

const root = document.getElementById('app');
if (root) render(() => <BoardDashboard />, root);
