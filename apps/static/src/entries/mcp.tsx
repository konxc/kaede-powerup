import { render } from 'solid-js/web';
import McpControl from '../pages/mcp';

const root = document.getElementById('app');
if (root) render(() => <McpControl />, root);
