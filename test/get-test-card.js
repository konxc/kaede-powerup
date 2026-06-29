#!/usr/bin/env node

/**
 * KAEDE MCP - Get Test Card ID
 *
 * Helper script untuk mendapatkan card ID dari test board.
 *
 * Usage:
 *   node test/get-test-card.js
 */

import { TrelloMCPClient } from '../src/trello-client.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';

// ─── Configuration ──

const TEST_BOARD_ID = 'rAKmlRj3'; // Lab Testing KAEDE

// ─── Helper Functions ──

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

function printSeparator() {
  console.log('  ──────────────────────────────────────');
}

function printSuccess(message) {
  console.log(`  ✓ ${message}`);
}

function printError(message) {
  console.error(`  ✗ ${message}`);
}

function printInfo(message) {
  console.log(`  ℹ ${message}`);
}

// ─── Main ──

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║      KAEDE — Get Test Card ID        ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');

  // Load credentials from global config
  const env = getSecrets();
  if (!env.TRELLO_API_KEY || !env.TRELLO_TOKEN) {
    printError('TRELLO_API_KEY or TRELLO_TOKEN not configured');
    console.error('    Run: bun scripts/kaede.mjs setup');
    process.exit(1);
  }
  printSuccess('Credentials loaded from global config');
  console.log('');
  console.log(`  Test Board: https://trello.com/b/${TEST_BOARD_ID}/lab-testing-kaede`);
  console.log('');

  // Initialize client
  const client = new TrelloMCPClient();

  try {
    console.log('  Connecting to MCP Server...');
    await client.connect();
    printSuccess('Connected to MCP Server');
    console.log('');

    // Get board lists
    console.log('  Fetching board lists...');
    const lists = await client.getLists(TEST_BOARD_ID);
    printSuccess(`Found ${lists.length} list(s)`);
    console.log('');

    // Get cards from each list
    for (const list of lists) {
      console.log(`  List: ${list.name}`);
      printSeparator();

      const cards = await client.getCardsByListId(list.id);

      if (cards.length === 0) {
        console.log('    (no cards)');
      } else {
        cards.forEach((card, i) => {
          console.log(`    [${i + 1}] ${card.name}`);
          console.log(`        ID: ${card.id}`);
          console.log(`        URL: ${card.url}`);
          console.log(`        Created: ${card.dateLastActivity}`);
          console.log('');
        });
      }
      console.log('');
    }

    // Summary
    console.log('  ──────────────────────────────────────');
    console.log('  Usage:');
    console.log('');

    const allCards = [];
    for (const list of lists) {
      const cards = await client.getCardsByListId(list.id);
      allCards.push(...cards);
    }

    if (allCards.length > 0) {
      const firstCard = allCards[0];
      console.log(`  Windows PowerShell:`);
      console.log(`    $env:TEST_CARD_ID="${firstCard.id}"; node test/manual-test-attachments.js`);
      console.log('');
      console.log(`  Linux/Mac:`);
      console.log(`    TEST_CARD_ID="${firstCard.id}" node test/manual-test-attachments.js`);
      console.log('');
    } else {
      printInfo('No cards found. Create a card in the test board first.');
      console.log('');
      console.log('  Test Board: https://trello.com/b/rAKmlRj3/lab-testing-kaede');
      console.log('');
    }
    printSeparator();
    console.log('');

    client.close();
    process.exit(0);
  } catch (error) {
    printError(`Connection failed: ${error.message}`);
    console.error('');
    console.error('  Make sure MCP server is built:');
    console.error('    bun run build:mcp');
    console.error('');
    client.close();
    process.exit(1);
  }
}

main();
