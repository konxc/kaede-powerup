#!/usr/bin/env node

/**
 * KAEDE MCP - Checklist Tools Manual Test
 *
 * Usage:
 *   node test/manual-test-checklist.js
 */

import { TrelloMCPClient } from '../src/trello-client.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';

// ─── Configuration ──

const TEST_CARD_ID = process.env.TEST_CARD_ID || '';

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

// ─── Test Functions ──

async function testGetChecklists(client, cardId) {
  console.log('');
  console.log('  Test 1: Get Card Checklists');
  printSeparator();

  try {
    const result = await client.getCardChecklists(cardId);
    console.log(`  Found ${result.checklists.length} checklist(s)`);

    if (result.checklists.length > 0) {
      result.checklists.forEach((cl, i) => {
        console.log(`    [${i + 1}] ${cl.name}`);
        console.log(`        Items: ${cl.itemCount}`);
        if (cl.items.length > 0) {
          cl.items.forEach((item) => {
            const checkMark = item.checked ? '✓' : ' ';
            console.log(`          - [${checkMark}] ${item.name}`);
          });
        }
      });
    }

    return { success: true, checklists: result.checklists };
  } catch (error) {
    printError(`Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testUpdateChecklistItem(client, checklistId, checkItemId) {
  console.log('');
  console.log('  Test 2: Update Checklist Item (Mark Complete)');
  printSeparator();

  try {
    const result = await client.updateChecklistItem({
      checklistId,
      checkItemId,
      checked: true,
    });
    printSuccess('Checklist item marked as complete');
    console.log(`    ID: ${result.id}`);
    console.log(`    Name: ${result.name}`);
    console.log(`    Checked: ${result.checked}`);
    return { success: true, result };
  } catch (error) {
    printError(`Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ─── Main ──

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   KAEDE — Manual Test Checklists     ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');

  // Load credentials
  const env = getSecrets();
  if (!env.TRELLO_API_KEY || !env.TRELLO_TOKEN) {
    printError('TRELLO_API_KEY or TRELLO_TOKEN not configured');
    console.error('    Run: bun scripts/kaede.mjs setup');
    process.exit(1);
  }
  printSuccess('Credentials loaded from global config');

  if (!TEST_CARD_ID) {
    console.log('');
    printInfo('TEST_CARD_ID not set');
    console.log('');
    console.log('  Windows PowerShell:');
    console.log('    $env:TEST_CARD_ID="CARD_ID"; node test/manual-test-checklist.js');
    console.log('');
    process.exit(0);
  }

  printSuccess(`Test Card ID: ${TEST_CARD_ID}`);
  console.log('');

  const client = new TrelloMCPClient();

  try {
    console.log('  Connecting to MCP Server...');
    await client.connect();
    printSuccess('Connected to MCP Server');
    console.log('');

    // Test get checklists
    const getResult = await testGetChecklists(client, TEST_CARD_ID);

    if (getResult.success && getResult.checklists.length > 0) {
      const firstChecklist = getResult.checklists[0];
      if (firstChecklist.items.length > 0) {
        const firstItem = firstChecklist.items[0];
        // Test update item
        await testUpdateChecklistItem(client, firstChecklist.id, firstItem.id);
      }
    }

    console.log('');
    printSeparator();
    console.log('  Tests completed. Check Trello UI for changes.');
    printSeparator();
    console.log('');

    client.close();
    process.exit(0);
  } catch (error) {
    printError(`Connection failed: ${error.message}`);
    client.close();
    process.exit(1);
  }
}

main();
