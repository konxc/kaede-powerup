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

  const cardId = '6a1b170320f6b4aa6ad055a9';
  console.log('Testing get_card_checklists with card:', cardId);

  const client = new TrelloMCPClient();
  await client.connect();

  try {
    const result = await client.getCardChecklists(cardId);
    console.log('✓ SUCCESS!');
    console.log('Found', result.checklists.length, 'checklist(s)');

    if (result.checklists.length > 0) {
      result.checklists.forEach((cl, i) => {
        console.log(\\n  [\] \ (ID: \)\);
        console.log(\      Items: \\);
        if (cl.items.length > 0) {
          cl.items.forEach(item => {
            const mark = item.checked ? '✓' : ' ';
            console.log(\        - [\] \\);
          });
        }
      });
    }
  } catch (error) {
    console.error('✗ FAILED:', error.message);
  }

  client.close();
}

main().catch(console.error);
