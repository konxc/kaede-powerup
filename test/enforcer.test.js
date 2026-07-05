import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCardPrefix,
  validateCardLabel,
  validateWorkflowList,
  validateRoleAccess,
  enforcePlaybook,
  enforceSingleAction,
} from '../src/enforcer';
import { parsePlaybook } from '../src/playbook-parser';

const playbook = parsePlaybook(`# Test Project
## Workflow Sprint
- **Backlog**: Ide
- **To Do**: Siap
- **In Progress**: Dikerjakan
- **Done**: Selesai
## Konvensi
\`feat:\` \`fix:\` \`docs:\` \`chore:\`
**Merah**: Bug / critical
**Kuning**: Enhancement
**Hijau**: Task selesai
`);

describe('enforcer', () => {
  describe('validateCardPrefix', () => {
    it('returns warning when card has no prefix', () => {
      const result = validateCardPrefix('Fix login bug', ['feat:', 'fix:', 'docs:']);
      assert.ok(result);
      assert.equal(result.rule, 'title_prefix');
    });

    it('returns null when card uses allowed prefix', () => {
      const result = validateCardPrefix('feat: add login', ['feat:', 'fix:', 'docs:']);
      assert.equal(result, null);
    });

    it('returns null when allowed prefixes is empty', () => {
      const result = validateCardPrefix('feat: add login', []);
      assert.equal(result, null);
    });

    it('returns warning when prefix not in allowed list', () => {
      const result = validateCardPrefix('ds: deploy staging', ['feat:', 'fix:']);
      assert.ok(result);
      assert.equal(result.rule, 'title_prefix');
      assert.equal(result.severity, 'warning');
      assert.ok(result.message.includes('ds:'));
    });

    it('is case-insensitive for prefix matching', () => {
      const result = validateCardPrefix('FEAT: add login', ['feat:', 'fix:', 'docs:']);
      assert.equal(result, null);
    });
  });

  describe('validateCardLabel', () => {
    const allowedLabels = [
      { color: 'Merah', meaning: 'Bug / critical' },
      { color: 'Kuning', meaning: 'Enhancement' },
      { color: 'Hijau', meaning: 'Task selesai' },
    ];

    it('returns null when label is allowed', () => {
      const result = validateCardLabel('Merah', allowedLabels);
      assert.equal(result, null);
    });

    it('returns null when allowed labels is empty', () => {
      const result = validateCardLabel('Merah', []);
      assert.equal(result, null);
    });

    it('returns warning when label is not in conventions', () => {
      const result = validateCardLabel('Biru', allowedLabels);
      assert.ok(result);
      assert.equal(result.rule, 'allowed_label');
      assert.equal(result.severity, 'warning');
    });

    it('returns null for null/undefined label', () => {
      const result = validateCardLabel('', allowedLabels);
      assert.equal(result, null);
    });
  });

  describe('validateWorkflowList', () => {
    const workflow = ['Backlog', 'To Do', 'In Progress', 'Done'];

    it('returns null when list is in workflow', () => {
      const result = validateWorkflowList('To Do', workflow);
      assert.equal(result, null);
    });

    it('returns info when list is not in workflow', () => {
      const result = validateWorkflowList('Archived', workflow);
      assert.ok(result);
      assert.equal(result.rule, 'workflow_list');
      assert.equal(result.severity, 'info');
    });

    it('returns null when workflow lists is empty', () => {
      const result = validateWorkflowList('To Do', []);
      assert.equal(result, null);
    });
  });

  describe('validateRoleAccess', () => {
    const roles = [
      { name: 'PM', responsibilities: ['Planning'], access: 'Admin', aiInstructions: '' },
      { name: 'Developer', responsibilities: ['Coding'], access: 'Write', aiInstructions: '' },
    ];

    it('returns null for allowed action', () => {
      const result = validateRoleAccess('PM', 'close_sprint', roles);
      assert.equal(result, null);
    });

    it('returns blocker for restricted action with wrong role', () => {
      const result = validateRoleAccess('Developer', 'close_sprint', roles);
      assert.ok(result);
      assert.equal(result.rule, 'role_access');
      assert.equal(result.severity, 'blocker');
    });

    it('returns null for unrestricted action', () => {
      const result = validateRoleAccess('Developer', 'create_card', roles);
      assert.equal(result, null);
    });
  });

  describe('enforcePlaybook', () => {
    it('returns safe for compliant plan', () => {
      const plan = [
        { action: 'create_card', params: { name: 'feat: add login', listName: 'To Do' }, description: '' },
      ];
      const result = enforcePlaybook(plan, playbook);
      assert.equal(result.safe, true);
      assert.equal(result.warnings.length, 0);
    });

    it('returns warnings for prefix violation', () => {
      const plan = [
        { action: 'create_card', params: { name: 'ds: deploy staging', listName: 'To Do' }, description: '' },
      ];
      const result = enforcePlaybook(plan, playbook);
      assert.equal(result.safe, true);
      assert.ok(result.warnings.length > 0);
      assert.equal(result.warnings[0].rule, 'title_prefix');
    });

    it('returns warnings for non-workflow list', () => {
      const plan = [
        { action: 'create_card', params: { name: 'feat: add login', listName: 'Archived' }, description: '' },
      ];
      const result = enforcePlaybook(plan, playbook);
      assert.ok(result.warnings.length > 0);
      assert.ok(result.warnings.some((w) => w.rule === 'workflow_list'));
    });

    it('detects multiple violations in one plan', () => {
      const plan = [
        { action: 'create_card', params: { name: 'ds: deploy', listName: 'Archived', labels: ['Biru'] }, description: '' },
      ];
      const result = enforcePlaybook(plan, playbook);
      assert.ok(result.warnings.length >= 2);
    });

    it('checks existing cards in boards', () => {
      const plan = [{ action: 'create_card', params: { name: 'New card', listName: 'To Do' }, description: '' }];
      const boards = [{
        boardId: 'b1',
        boardName: 'Test',
        lists: [{
          listId: 'l1',
          listName: 'To Do',
          cards: [{ id: 'c1', name: 'ds: existing card' }],
        }],
      }];
      const result = enforcePlaybook(plan, playbook, boards);
      assert.ok(result.warnings.length > 0);
      assert.ok(result.warnings.some((w) => w.rule === 'title_prefix'));
    });

    it('returns summary string', () => {
      const result = enforcePlaybook([], playbook);
      assert.ok(result.summary);
      assert.equal(result.summary, 'All actions comply with playbook conventions.');
    });
  });

  describe('enforceSingleAction', () => {
    it('validates a single action', () => {
      const result = enforceSingleAction('create_card', { name: 'fix: resolve bug', listName: 'To Do' }, playbook);
      assert.equal(result.safe, true);
    });

    it('returns warning for non-compliant action', () => {
      const result = enforceSingleAction('create_card', { name: 'random card', listName: 'To Do' }, playbook);
      assert.equal(result.safe, true);
      assert.equal(result.warnings.length, 1);
    });
  });
});
