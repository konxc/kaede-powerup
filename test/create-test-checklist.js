import { TrelloMCPClient } from '../src/trello-client.js';
import { homedir } from 'os';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, 'utf-8');
  const vars = {};
  for (const line of content.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (k) vars[k] = v;
  }
  return vars;
}

function getSecrets() {
  const global = resolve(homedir(), '.config', 'kaede', 'secrets.env');
  const local = resolve(process.cwd(), 'secrets.env');
  let merged = {};
  for (const p of [local, global]) {
    merged = { ...merged, ...loadEnv(p) };
  }
  return merged;
}

async function main() {
  const env = getSecrets();
  if (!env.TRELLO_API_KEY || !env.TRELLO_TOKEN) {
    console.error('Credentials not configured');
    process.exit(1);
  }

  const cardId = process.env.TEST_CARD_ID;
  if (!cardId) {
    console.error('TEST_CARD_ID not set');
    process.exit(1);
  }

  const client = new TrelloMCPClient();
  await client.connect();

  console.log('Creating checklist on card:', cardId);
  
  // Create checklist
  const checklist = await client.createChecklist(cardId, 'Test Checklist');
  console.log('✓ Created checklist:', checklist.name, '(' + checklist.id + ')');

  // Add items
  const item1 = await client.addChecklistItem(checklist.id, 'Item 1 - Test get_card_checklists');
  console.log('✓ Added item 1:', item1.name);

  const item2 = await client.addChecklistItem(checklist.id, 'Item 2 - Test update_checklist_item');
  console.log('✓ Added item 2:', item2.name);

  const item3 = await client.addChecklistItem(checklist.id, 'Item 3 - Test delete_checklist_item');
  console.log('✓ Added item 3:', item3.name);

  console.log('');
  console.log('Checklist created successfully!');
  console.log('Checklist ID:', checklist.id);
  console.log('Card ID:', cardId);
  console.log('');
  console.log('Now you can test:');
  console.log('  node test/manual-test-checklist.js');

  client.close();
}

main().catch(console.error);
