#!/usr/bin/env bun
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
  for (const p of [local, global]) merged = { ...merged, ...loadEnv(p) };
  return merged;
}

async function main() {
  const env = getSecrets();
  if (!env.TRELLO_API_KEY || !env.TRELLO_TOKEN) {
    console.error('Credentials not configured');
    process.exit(1);
  }

  const cardId = '6a1b170320f6b4aa6ad055a9';
  const boardId = 'rAKmlRj3';

  const client = new TrelloMCPClient();
  await client.connect();
  let pass = 0,
    fail = 0;

  async function test(name, fn) {
    try {
      const res = await fn();
      console.log(`  \u2713 ${name}`);
      pass++;
    } catch (e) {
      console.log(`  \u2717 ${name}: ${e.message}`);
      fail++;
    }
  }

  await test('get_card_activity', async () => {
    const r = await client.callTool('get_card_activity', { cardId, limit: 5 });
    if (!r.actions) throw new Error('no actions');
  });

  await test('search_labels', async () => {
    const r = await client.callTool('search_labels', { boardId, query: 'bug' });
    if (!r.labels) throw new Error('no labels');
  });

  await test('remove_label_from_card', async () => {
    const labels = await client.callTool('get_board_labels', { boardId });
    if (labels.labels?.length > 0) {
      await client.callTool('remove_label_from_card', { cardId, labelId: labels.labels[0].id });
      await client.callTool('update_card_details', { cardId, labels: [labels.labels[0].id] });
    }
  });

  await test('watch_card', async () => {
    const r = await client.callTool('watch_card', { cardId, add: true });
    if (!r.subscribed) throw new Error('not subscribed');
  });

  await test('watch_card off', async () => {
    await client.callTool('watch_card', { cardId, remove: true });
  });

  console.log(`\n  Results: ${pass} passed, ${fail} failed`);
  client.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
