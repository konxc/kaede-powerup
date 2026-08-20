import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitCompoundGoal,
  injectAutoRefs,
  resolveCrossPlanRefs,
  extractChainArgs,
} from '../src/auto-chainer';
import { parsePlaybook } from '../src/playbook-parser';

const mockPlaybook = parsePlaybook(`# Test
## Workflow Sprint
- **Backlog**: Ide
- **To Do**: Siap
- **In Progress**: Dikerjakan
- **Done**: Selesai
`);

function makeStep(action, params, desc, ref) {
  return { action, params, description: desc, ...(ref ? { ref } : {}) };
}

describe('auto-chainer', () => {
  describe('splitCompoundGoal', () => {
    it('returns empty array for empty string', () => {
      assert.deepEqual(splitCompoundGoal(''), []);
      assert.deepEqual(splitCompoundGoal('   '), []);
    });

    it('returns single goal when no conjunction found', () => {
      assert.deepEqual(splitCompoundGoal('buat card fitur login'), ['buat card fitur login']);
    });

    it('splits by " lalu "', () => {
      const result = splitCompoundGoal('buat card fitur login lalu assign ke Alice');
      assert.equal(result.length, 2);
      assert.ok(result[0].includes('buat card'));
      assert.ok(result[1].includes('assign'));
    });

    it('splits by " dan "', () => {
      const result = splitCompoundGoal('buat card fitur A dan buat card fitur B');
      assert.equal(result.length, 2);
    });

    it('splits by " then "', () => {
      const result = splitCompoundGoal('create card then assign to Alice');
      assert.equal(result.length, 2);
    });

    it('splits by comma', () => {
      const result = splitCompoundGoal('buat card fitur login , assign ke Alice');
      assert.equal(result.length, 2);
    });

    it('splits by " setelah itu "', () => {
      const result = splitCompoundGoal('create card setelah itu add comment');
      assert.equal(result.length, 2);
    });
  });

  describe('injectAutoRefs', () => {
    it('injects ref for create_card step', () => {
      const plan = [makeStep('create_card', { name: 'Test' }, 'Buat card')];
      const result = injectAutoRefs(plan);
      assert.equal(result[0].ref, 'card:0');
    });

    it('does not override existing ref', () => {
      const plan = [makeStep('create_card', { name: 'Test' }, 'Buat card', 'custom:0')];
      const result = injectAutoRefs(plan);
      assert.equal(result[0].ref, 'custom:0');
    });

    it('increments ref index for multiple same-type steps', () => {
      const plan = [
        makeStep('create_card', { name: 'A' }, 'Card A'),
        makeStep('create_card', { name: 'B' }, 'Card B'),
      ];
      const result = injectAutoRefs(plan);
      assert.equal(result[0].ref, 'card:0');
      assert.equal(result[1].ref, 'card:1');
    });

    it('injects ref for create_list, create_label, add_comment', () => {
      const plan = [
        makeStep('create_list', { name: 'Col' }, 'List'),
        makeStep('create_label', { name: 'Bug' }, 'Label'),
        makeStep('add_comment', { text: 'hai' }, 'Comment'),
      ];
      const result = injectAutoRefs(plan);
      assert.equal(result[0].ref, 'list:0');
      assert.equal(result[1].ref, 'label:0');
      assert.equal(result[2].ref, 'comment:0');
    });
  });

  describe('resolveCrossPlanRefs', () => {
    it('merges two plans with unique refs', () => {
      const planA = [{ action: 'create_card', params: { name: 'A' }, description: 'Card A', ref: 'card:0' }];
      const planB = [{ action: 'create_card', params: { name: 'B' }, description: 'Card B', ref: 'card:0' }];

      const result = resolveCrossPlanRefs([planA, planB]);
      assert.equal(result.length, 2);
      assert.equal(result[0].ref, 'card:0');
      assert.equal(result[1].ref, 'card:1');
    });

    it('resolves ref: references across plans', () => {
      const planA = [{ action: 'create_card', params: { name: 'A' }, description: 'Card A', ref: 'card:0' }];
      const planB = [{
        action: 'add_comment',
        params: { cardId: 'ref:card:0', text: 'nice' },
        description: 'Comment',
        dependsOn: ['card:0'],
      }];

      const result = resolveCrossPlanRefs([planA, planB]);
      assert.equal(result[0].ref, 'card:0');
      assert.equal(result[1].params.cardId, 'ref:card:0');
    });
  });

  describe('extractChainArgs', () => {
    it('returns empty when no chainable args', () => {
      assert.deepEqual(extractChainArgs({ task: 'Test' }), []);
    });

    it('extracts member as sub-arg', () => {
      const result = extractChainArgs({ task: 'Login', member: 'alice' });
      assert.equal(result.length, 2);
      assert.equal(result[0].task, 'Login');
      assert.deepEqual(result[1], { member: 'alice', cardId: 'ref:card:0' });
    });

    it('extracts comment as sub-arg', () => {
      const result = extractChainArgs({ task: 'Login', comment: 'Nice work' });
      assert.equal(result.length, 2);
      assert.equal(result[1].cardId, 'ref:card:0');
      assert.equal(result[1].text, 'Nice work');
    });
  });

});
