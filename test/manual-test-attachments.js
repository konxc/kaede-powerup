#!/usr/bin/env node

/**
 * KAEDE MCP - Attachments Manual Test Script
 *
 * Script untuk manual testing attachment tools dengan test board.
 *
 * Usage:
 *   node test/manual-test-attachments.js
 *
 * Prerequisites:
 * - secrets.env configured
 * - MCP server built (bun run build:mcp)
 * - Test card ID from https://trello.com/b/rAKmlRj3/lab-testing-kaede
 */

import { TrelloMCPClient } from '../src/trello-client.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';

// ─── Configuration ──

const TEST_CARD_ID = process.env.TEST_CARD_ID || '';
const TEST_IMAGE_URL = 'https://via.placeholder.com/400x300.png?text=KAEDE+Test+Attachment';
const TEST_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

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

async function testAttachImage(client, cardId) {
  console.log('');
  console.log('  Test 1: Attach Image from URL');
  printSeparator();

  try {
    const result = await client.attachImageToCard(cardId, TEST_IMAGE_URL, 'Test Image Attachment');
    printSuccess('Image attached successfully');
    console.log(`    ID: ${result.id}`);
    console.log(`    Name: ${result.name}`);
    console.log(`    URL: ${result.url}`);
    console.log(`    MIME: ${result.mimeType}`);
    return true;
  } catch (error) {
    printError(`Failed: ${error.message}`);
    return false;
  }
}

async function testAttachFile(client, cardId) {
  console.log('');
  console.log('  Test 2: Attach PDF from URL');
  printSeparator();

  try {
    const result = await client.attachFileToCard(cardId, TEST_PDF_URL, 'Test PDF Attachment');
    printSuccess('PDF attached successfully');
    console.log(`    ID: ${result.id}`);
    console.log(`    Name: ${result.name}`);
    console.log(`    URL: ${result.url}`);
    console.log(`    MIME: ${result.mimeType}`);
    return true;
  } catch (error) {
    printError(`Failed: ${error.message}`);
    return false;
  }
}

async function testGetAttachments(client, cardId) {
  console.log('');
  console.log('  Test 3: Get Card Attachments');
  printSeparator();

  try {
    const attachments = await client.getCardAttachments(cardId);
    printSuccess(`Found ${attachments.length} attachment(s)`);

    if (attachments.length > 0) {
      attachments.forEach((att, i) => {
        console.log(`    [${i + 1}] ${att.name}`);
        console.log(`        Type: ${att.mimeType}`);
        console.log(`        Size: ${att.bytes} bytes`);
        console.log(`        URL: ${att.url}`);
      });
    }
    return true;
  } catch (error) {
    printError(`Failed: ${error.message}`);
    return false;
  }
}

async function testCopyCard(client, sourceCardId, targetListId) {
  console.log('');
  console.log('  Test 4: Copy Card');
  printSeparator();

  try {
    const result = await client.copyCard({
      sourceCardId: sourceCardId,
      listId: targetListId,
      name: 'Copied Test Card',
      keepFromSource: 'all',
    });
    printSuccess('Card copied successfully');
    console.log(`    ID: ${result.id}`);
    console.log(`    Name: ${result.name}`);
    console.log(`    URL: ${result.url}`);
    console.log(`    List: ${result.listId}`);
    return true;
  } catch (error) {
    printError(`Failed: ${error.message}`);
    return false;
  }
}

// ─── Main ──

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║    KAEDE — Manual Test Attachments   ║');
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

  // Check test card ID
  if (!TEST_CARD_ID) {
    console.log('');
    printInfo('TEST_CARD_ID not set');
    console.log('');
    console.log('  To run tests, set TEST_CARD_ID environment variable:');
    console.log('');
    console.log('  Windows PowerShell:');
    console.log('    $env:TEST_CARD_ID="YOUR_CARD_ID"; node test/manual-test-attachments.js');
    console.log('');
    console.log('  Linux/Mac:');
    console.log('    TEST_CARD_ID="YOUR_CARD_ID" node test/manual-test-attachments.js');
    console.log('');
    console.log('  Get card ID from: https://trello.com/b/rAKmlRj3/lab-testing-kaede');
    console.log('');
    process.exit(0);
  }

  printSuccess(`Test Card ID: ${TEST_CARD_ID}`);
  console.log('');
  console.log('  Test Board: https://trello.com/b/rAKmlRj3/lab-testing-kaede');
  console.log('');

  // Initialize client
  const client = new TrelloMCPClient();

  try {
    console.log('  Connecting to MCP Server...');
    await client.connect();
    printSuccess('Connected to MCP Server');
    console.log('');

    // Run tests
    const results = [];

    results.push(await testAttachImage(client, TEST_CARD_ID));
    results.push(await testAttachFile(client, TEST_CARD_ID));
    results.push(await testGetAttachments(client, TEST_CARD_ID));

    // Summary
    console.log('');
    printSeparator();
    console.log(`  Tests completed: ${results.filter((r) => r).length}/${results.length} passed`);
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
