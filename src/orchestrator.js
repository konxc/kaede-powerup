/**
 * KAEDE Orchestrator — Lapisan kecerdasan di atas Trello MCP
 * 
 * Membaca Playbook untuk memahami workflow, lalu mengeksekusi
 * serangkaian tindakan Trello berdasarkan intent pengguna.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { TrelloMCPClient } from './trello-client.js';

export function parsePlaybook(content) {
  const lines = content.split('\n');
  const result = {
    roles: [],
    workflow: { lists: [] },
    conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] },
  };

  let currentSection = null;
  let currentRole = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const listItem = line.match(/^[-*]\s+\*\*(.+?)\*\*:\s*(.*)/);
    const codeBlock = line.match(/^```/);

    if (h2) {
      currentSection = h2[1].toLowerCase();
      if (currentSection.includes('peran') || currentSection.includes('role')) {
        currentSection = 'roles';
      } else if (currentSection.includes('alur') || currentSection.includes('workflow')) {
        currentSection = 'workflow';
      } else if (currentSection.includes('konvensi') || currentSection.includes('nama')) {
        currentSection = 'conventions';
      }
      continue;
    }

    if (currentSection === 'roles' && h3) {
      if (currentRole) result.roles.push(currentRole);
      const roleName = h3[1].replace(/Peran:\s*/i, '').trim();
      currentRole = { name: roleName, responsibilities: [], access: '', aiInstructions: '' };
      continue;
    }

    if (currentRole && listItem) {
      const key = listItem[1].toLowerCase();
      const value = listItem[2].trim();
      if (key.includes('tanggung')) {
        currentRole.responsibilities.push(value);
      } else if (key.includes('akses')) {
        currentRole.access = value;
      } else if (key.includes('ai')) {
        currentRole.aiInstructions = value;
      }
    }

    if (currentSection === 'workflow' && (listItem || line.match(/^\d+\.\s+\*\*(.+?)\*\*/))) {
      let listName = '';
      if (listItem) {
        listName = listItem[1].replace(/^\d+\./, '').trim();
      } else {
        const numbered = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
        if (numbered) listName = numbered[1].trim();
      }
      if (listName && !result.workflow.lists.includes(listName)) {
        result.workflow.lists.push(listName);
      }
    }

    if (currentSection === 'conventions') {
      if (line.match(/`feat:|`fix:|`docs:|`chore:/)) {
        const prefixes = line.match(/`(feat|fix|docs|chore):/g);
        if (prefixes) {
          result.conventions.titlePrefixes = prefixes.map(p => p.replace(/`/g, ''));
        }
      }
      if (line.match(/Merah:|Kuning:|Hijau:/)) {
        const labelMatch = line.match(/(\w+):\s*(.+)/);
        if (labelMatch) {
          result.conventions.labels.push({ color: labelMatch[1], meaning: labelMatch[2] });
        }
      }
    }
  }

  if (currentRole) result.roles.push(currentRole);
  return result;
}

export async function executeIntent(client, intent, playbookContext, boardId) {
  const actions = [];
  const results = [];
  
  if (intent.toLowerCase().includes('mulai sprint') || intent.toLowerCase().includes('setup sprint')) {
    const { lists } = playbookContext.workflow;
    
    for (const listName of lists) {
      try {
        const result = await client.createList(boardId, listName);
        results.push({ success: true, type: 'create_list', name: listName, result });
      } catch (err) {
        results.push({ success: false, type: 'create_list', name: listName, error: err.message });
      }
    }
  }

  return results;
}

export function bundleContext(paths) {
  const context = {
    playbook: null,
    openkb: { glossary: [], decisions: [] },
    opencode: null,
  };

  if (paths.playbook && existsSync(paths.playbook)) {
    const content = readFileSync(paths.playbook, 'utf-8');
    context.playbook = parsePlaybook(content);
  }

  if (paths.openkb) {
    const glossaryPath = resolve(paths.openkb, 'SHARED', 'glossary.md');
    if (existsSync(glossaryPath)) {
      const gl = readFileSync(glossaryPath, 'utf-8');
      context.openkb.glossary = gl.split('\n').filter(l => l.startsWith('- **'));
    }
    const decisionPath = resolve(paths.openkb, 'SHARED', 'decision-log.md');
    if (existsSync(decisionPath)) {
      const dl = readFileSync(decisionPath, 'utf-8');
      context.openkb.decisions = dl.split('\n').filter(l => l.startsWith('## '));
    }
  }

  if (paths.opencode) {
    const configPath = resolve(paths.opencode, 'opencode.json');
    if (existsSync(configPath)) {
      context.opencode = JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  }

  return context;
}