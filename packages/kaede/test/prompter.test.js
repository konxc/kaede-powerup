import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveBoard,
  resolveList,
  inferFromGoal,
  resolveContext,
  fillCardDefaults,
} from '../src/prompter.ts';

describe('Prompt Builder & Smart Defaults', () => {
  describe('resolveBoard', () => {
    const boards = [
      { boardId: 'b1', boardName: 'Backend Board' },
      { boardId: 'b2', boardName: 'Frontend Board' },
      { boardId: 'b3', boardName: 'Entry Board' },
    ];

    it('returns exact match by name', () => {
      const r = resolveBoard('Backend Board', boards);
      assert.equal(r.boardId, 'b1');
      assert.equal(r.confidence, 'exact');
    });

    it('returns exact match by id', () => {
      const r = resolveBoard('b2', boards);
      assert.equal(r.boardId, 'b2');
      assert.equal(r.boardName, 'Frontend Board');
      assert.equal(r.confidence, 'exact');
    });

    it('returns fuzzy match', () => {
      const r = resolveBoard('backend', boards);
      assert.equal(r.boardId, 'b1');
      assert.equal(r.confidence, 'fuzzy');
    });

    it('returns fallback to first board when no input', () => {
      const r = resolveBoard(undefined, boards);
      assert.equal(r.boardId, 'b1');
      assert.equal(r.boardName, 'Backend Board');
      assert.equal(r.confidence, 'fallback');
    });

    it('returns fallback when no boards provided', () => {
      const r = resolveBoard('anything');
      assert.equal(r.boardId, '');
      assert.equal(r.confidence, 'fallback');
    });

    it('returns fallback when no match found', () => {
      const r = resolveBoard('Nonexistent Board', boards);
      assert.equal(r.boardId, 'b1');
      assert.equal(r.confidence, 'fallback');
    });
  });

  describe('resolveList', () => {
    const playbook = {
      title: 'Test',
      roles: [],
      workflow: { lists: ['Backlog', 'Sprint', 'In Progress', 'Done'] },
      conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] },
    };

    it('returns exact list name when specified', () => {
      const r = resolveList('In Progress', playbook);
      assert.equal(r.listName, 'In Progress');
      assert.equal(r.confidence, 'exact');
    });

    it('returns first workflow list when not specified', () => {
      const r = resolveList(undefined, playbook);
      assert.equal(r.listName, 'Backlog');
      assert.equal(r.confidence, 'fallback');
    });

    it('returns Sprint when no playbook provided', () => {
      const r = resolveList(undefined);
      assert.equal(r.listName, 'Sprint');
      assert.equal(r.confidence, 'fallback');
    });
  });

  describe('inferFromGoal', () => {
    it('infers feature template', () => {
      const r = inferFromGoal('Implement user login feature');
      assert.equal(r.templateName, 'feature');
    });

    it('infers bug template', () => {
      const r = inferFromGoal('Fix 500 error on login page bug');
      assert.equal(r.templateName, 'bug');
    });

    it('infers task template', () => {
      const r = inferFromGoal('Create API endpoint for attendance');
      assert.equal(r.templateName, 'task');
    });

    it('infers chore template', () => {
      const r = inferFromGoal('Update dependencies to latest version');
      assert.equal(r.templateName, 'chore');
    });

    it('infers onboarding template', () => {
      const r = inferFromGoal('Onboarding for new team member');
      assert.equal(r.templateName, 'onboarding');
    });

    it('returns empty when no match', () => {
      const r = inferFromGoal('Random goal without keywords');
      assert.equal(r.templateName, undefined);
    });

    it('infers priority from goal', () => {
      const critical = inferFromGoal('Critical urgent bug P0 blocking production');
      assert.equal(critical.priority, 'Critical');

      const high = inferFromGoal('High priority feature P1');
      assert.equal(high.priority, 'High');

      const low = inferFromGoal('Low priority minor improvement P3');
      assert.equal(low.priority, 'Low');
    });

    it('infers board hints from goal', () => {
      const r = inferFromGoal('Setup backend and frontend for auth');
      assert.ok(r.suggestedBoards);
      assert.ok(r.suggestedBoards.includes('backend'));
      assert.ok(r.suggestedBoards.includes('frontend'));
    });

    it('extracts task hint from goal', () => {
      const r = inferFromGoal('Buat attendance module with geolocation');
      assert.equal(r.taskHint, 'attendance module');
    });
  });

  describe('resolveContext', () => {
    const playbook = {
      title: 'Test',
      roles: [],
      workflow: { lists: ['Backlog', 'Sprint', 'Done'] },
      conventions: { titlePrefixes: [], descriptionTemplate: '', labels: [] },
    };

    const boards = [
      { boardId: 'b1', boardName: 'Backend Board' },
      { boardId: 'b2', boardName: 'Frontend Board' },
    ];

    it('resolves exact board and list', () => {
      const r = resolveContext(
        { boardName: 'Frontend Board', list: 'Sprint' },
        { goal: 'Setup feature', playbook, boards },
      );
      assert.equal(r.boardId, 'b2');
      assert.equal(r.listName, 'Sprint');
      assert.equal(r.confidence, 'exact');
      assert.equal(r.warnings.length, 1); // auto-inferred template from goal "Setup feature"
    });

    it('auto-resolves list from playbook when not specified', () => {
      const r = resolveContext(
        { boardName: 'Backend Board' },
        { goal: 'Some random goal', playbook, boards },
      );
      assert.equal(r.boardId, 'b1');
      assert.equal(r.listName, 'Backlog');
      assert.equal(r.warnings.length, 0); // no template inferred from random goal
    });

    it('generates warnings for fuzzy matches', () => {
      const r = resolveContext(
        { boardName: 'backend', list: 'Unknown List' },
        { goal: 'Test', playbook, boards },
      );
      assert.ok(r.warnings.length >= 1);
    });

    it('falls back gracefully with no content', () => {
      const r = resolveContext({}, { goal: 'test' });
      assert.equal(r.boardId, '');
      assert.equal(r.listName, 'Sprint');
      assert.equal(r.confidence, 'fallback');
    });
  });

  describe('fillCardDefaults', () => {
    it('fills empty fields with defaults', () => {
      const defaults = { listName: 'Sprint', boardName: 'Backend Board' };
      const inference = inferFromGoal('Create feature');
      const card = fillCardDefaults(
        { task: 'Login' },
        defaults,
        inference,
      );
      assert.equal(card.task, 'Login');
      assert.equal(card.list, 'Sprint');
      assert.equal(card.desc, '');
    });

    it('preserves existing fields', () => {
      const card = fillCardDefaults(
        { task: 'Auth', desc: 'Custom desc', list: 'Done' },
        { listName: 'Sprint', boardName: 'Backend Board' },
        inferFromGoal('test'),
      );
      assert.equal(card.desc, 'Custom desc');
      assert.equal(card.list, 'Done');
    });
  });
});
