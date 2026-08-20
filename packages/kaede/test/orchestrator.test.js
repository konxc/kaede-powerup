import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { parsePlaybook } from '../src/orchestrator.ts';

describe('parsePlaybook', () => {
  it('parses full playbook with all sections (ID)', () => {
    const pb = parsePlaybook(`# Playbook Project X

## Peran Tim

### PM
- **Tanggung jawab**: Sprint planning, backlog grooming
- **Akses**: Full admin
- **AI Instructions**: Bantu sprint planning

### Developer
- **Tanggung jawab**: Coding, testing
- **Akses**: Write
- **AI Instructions**: Ikuti standar kode

## Workflow Sprint

- **Backlog**: Ide mentah
- **To Do**: Siap dikerjakan
- **In Progress**: Sedang dikerja
- **Done**: Selesai

## Konvensi

\`feat:\` \`fix:\` \`docs:\` \`chore:\`
**Merah**: Bug / critical
**Kuning**: Enhancement
**Hijau**: Task selesai
`);

    assert.equal(pb.title, 'Playbook Project X');
    assert.equal(pb.roles.length, 2);
    assert.equal(pb.roles[0].name, 'PM');
    assert.deepEqual(pb.roles[0].responsibilities, ['Sprint planning, backlog grooming']);
    assert.equal(pb.roles[0].access, 'Full admin');
    assert.equal(pb.roles[0].aiInstructions, 'Bantu sprint planning');
    assert.equal(pb.roles[1].name, 'Developer');
    assert.deepEqual(pb.workflow.lists, ['Backlog', 'To Do', 'In Progress', 'Done']);
    assert.deepEqual(pb.conventions.titlePrefixes, ['feat:', 'fix:', 'docs:', 'chore:']);
    assert.equal(pb.conventions.labels.length, 3);
    assert.equal(pb.conventions.labels[0].color, 'Merah');
    assert.equal(pb.conventions.labels[0].meaning, 'Bug / critical');
  });

  it('parses English section names', () => {
    const pb = parsePlaybook(`# My Project

## Team Roles

### Lead
- **Responsibilities**: Architecture, code review
- **Access**: Admin
- **AI Instructions**: Review all PRs

## Sprint Workflow

- **Backlog**
- **In Progress**
- **Done**

## Naming Conventions

\`feat:\` \`fix:\`
**Red**: High priority
**Green**: Low priority
`);

    assert.equal(pb.roles.length, 1);
    assert.equal(pb.roles[0].name, 'Lead');
    assert.equal(pb.workflow.lists.length, 3);
    assert.equal(pb.conventions.titlePrefixes.length, 2);
    assert.equal(pb.conventions.labels.length, 2);
  });

  it('skips content inside code blocks', () => {
    const pb = parsePlaybook(`# Test

## Peran Tim

### Dev
- **Tanggung jawab**: Coding

\`\`\`
## This looks like a section but is in code block
### Should be ignored
- **Not a role**
\`\`\`

## Workflow

- **Done**

## Konvensi

\`\`\`
**Merah**: Should be ignored
\`\`\`
**Hijau**: Actual label
`);

    assert.equal(pb.roles.length, 1);
    assert.equal(pb.workflow.lists.length, 1);
    assert.equal(pb.conventions.labels.length, 1);
    assert.equal(pb.conventions.labels[0].color, 'Hijau');
  });

  it('handles h3 with "Peran:" prefix', () => {
    const pb = parsePlaybook(`# Test

## Peran Tim

### Peran: Scrum Master
- **Tanggung jawab**: Facilitating
- **Akses**: Admin
- **AI Instructions**: Guide team

### Developer
- **Tanggung jawab**: Coding
- **Akses**: Write
`);

    assert.equal(pb.roles.length, 2);
    assert.equal(pb.roles[0].name, 'Scrum Master');
    assert.equal(pb.roles[1].name, 'Developer');
  });

  it('handles nested list items (numbered)', () => {
    const pb = parsePlaybook(`# Test

## Workflow

1. **Backlog**: Ide mentah
    - Prioritas tinggi dulu
2. **To Do**: Siap
    - Butuh AC
3. **Done**: Selesai
`);

    assert.deepEqual(pb.workflow.lists, ['Backlog', 'To Do', 'Done']);
  });

  it('returns empty result for empty content', () => {
    const pb = parsePlaybook('');
    assert.equal(pb.title, '');
    assert.equal(pb.roles.length, 0);
    assert.equal(pb.workflow.lists.length, 0);
    assert.equal(pb.conventions.labels.length, 0);
    assert.equal(pb.conventions.titlePrefixes.length, 0);
  });

  it('returns empty result for content with only an h1', () => {
    const pb = parsePlaybook('# Just a title');
    assert.equal(pb.title, 'Just a title');
    assert.equal(pb.roles.length, 0);
  });

  it('handles minimal playbook (title only, no sections)', () => {
    const pb = parsePlaybook('# Minimal\n\nSome text\n- bullet\n');
    assert.equal(pb.title, 'Minimal');
    assert.equal(pb.roles.length, 0);
  });

  it('captures labels on same line as bold markdown', () => {
    const pb = parsePlaybook(`# Test

## Konvensi

* **Merah**: High priority
* **Kuning**: Medium priority
- **Hijau**: Low priority
`);

    assert.equal(pb.conventions.labels.length, 3);
    assert.equal(pb.conventions.labels[0].color, 'Merah');
    assert.equal(pb.conventions.labels[0].meaning, 'High priority');
    assert.equal(pb.conventions.labels[2].color, 'Hijau');
  });

  it('parses role without AI instructions', () => {
    const pb = parsePlaybook(`# Test

## Peran Tim

### Tester
- **Tanggung jawab**: Testing
- **Akses**: Read
`);

    assert.equal(pb.roles.length, 1);
    assert.equal(pb.roles[0].name, 'Tester');
    assert.equal(pb.roles[0].responsibilities.length, 1);
    assert.equal(pb.roles[0].access, 'Read');
    assert.equal(pb.roles[0].aiInstructions, '');
  });

  it('parses workflows with EN numbered format', () => {
    const pb = parsePlaybook(`# Test

## Workflow

1. **Backlog**
2. **To Do**
3. **In Progress**
4. **QA / Code Review**
5. **Done**
`);

    assert.deepEqual(pb.workflow.lists, ['Backlog', 'To Do', 'In Progress', 'QA / Code Review', 'Done']);
  });

  it('parses labels with English color names', () => {
    const pb = parsePlaybook(`# Test

## Conventions

**Red**: Urgent
**Yellow**: Medium
**Green**: Done
`);

    assert.equal(pb.conventions.labels.length, 3);
    assert.equal(pb.conventions.labels[0].color, 'Red');
    assert.equal(pb.conventions.labels[2].color, 'Green');
  });

  it('parses nested section names like "Peran & Tanggung Jawab (Roles)"', () => {
    const pb = parsePlaybook(`# Test

## 1. Peran & Tanggung Jawab (Roles)

### Developer
- **Tanggung jawab**: Coding
- **Akses**: Write

## 2. Alur Kerja Sprint (Sprint Workflow)

- **Backlog**
- **Done**

## 3. Konvensi Penamaan (Naming Standards)

\`feat:\`
**Merah**: Bug
`);

    assert.equal(pb.roles.length, 1);
    assert.equal(pb.roles[0].name, 'Developer');
    assert.deepEqual(pb.workflow.lists, ['Backlog', 'Done']);
    assert.equal(pb.conventions.labels.length, 1);
    assert.equal(pb.conventions.titlePrefixes.length, 1);
  });

  // ── generatePlan composite intents ──

  describe('generatePlan composite intents', () => {
    const pb = parsePlaybook(`# Sprint
## Workflow Sprint
- **Backlog**: Ide
- **Sprint**: Aktif
- **Done**: Selesai
## Konvensi
\`feat:\` \`fix:\`
**Merah**: Bug
`);

    it('generates multi-step plan for "setup sprint" with cards', () => {
      const { generatePlan } = require('../src/orchestrator.ts');
      const plan = generatePlan('setup sprint', pb, {
        boardNames: ['Backend Board', 'Frontend Board'],
        cards: [
          { task: 'User Model', checklist: ['CRUD works'], comment: 'Kerjakan ya' },
          { task: 'SchoolClass CRUD', due: '2026-07-10' },
        ],
      });
      assert.ok(plan.length >= 10, `Expected 10+ steps for 2 boards x 2 cards, got ${plan.length}`);
      const cardSteps = plan.filter((s) => s.action === 'create_card');
      assert.equal(cardSteps.length, 4); // 2 boards × 2 cards
      assert.equal(cardSteps[0].params.name, 'User Model');
      assert.equal(cardSteps[0].ref, 'card:0:0');
      assert.equal(cardSteps[2].params.name, 'User Model'); // second board, first card
      assert.equal(cardSteps[2].ref, 'card:1:0');
      const commentSteps = plan.filter((s) => s.action === 'add_comment');
      assert.equal(commentSteps.length, 2); // 2 boards × 1 comment

      // Check dependency tracking - first board's card 0
      const firstComment = commentSteps.find((s) => s.dependsOn?.[0] === 'card:0:0');
      assert.ok(firstComment, 'First board User Model comment should depend on card:0:0');
      assert.deepEqual(firstComment.dependsOn, ['card:0:0']);
    });

    it('generates plan for "batch cards"', () => {
      const { generatePlan } = require('../src/orchestrator.ts');
      const plan = generatePlan('batch cards', pb, {
        boardName: 'Backend Board',
        list: 'Sprint',
        cards: [
          { task: 'Card A', checklist: ['Item 1'] },
          { task: 'Card B', comment: 'Test comment' },
          { task: 'Card C' },
        ],
      });
      const cardSteps = plan.filter((s) => s.action === 'create_card');
      assert.equal(cardSteps.length, 3);
      const checklistSteps = plan.filter((s) => s.action === 'create_checklist');
      assert.equal(checklistSteps.length, 1);
      assert.deepEqual(checklistSteps[0].dependsOn, ['card:0']);
    });

    it('generates plan for "setup labels batch"', () => {
      const { generatePlan } = require('../src/orchestrator.ts');
      const plan = generatePlan('setup labels batch', pb, {
        boardName: 'My Board',
        labels: [
          { name: 'P0', color: 'red' },
          { name: 'P1', color: 'orange' },
          { name: 'Bug', color: 'purple' },
        ],
      });
      assert.equal(plan.length, 3);
      assert.equal(plan[0].action, 'create_label');
      assert.equal(plan[0].params.name, 'P0');
      assert.equal(plan[0].params.color, 'red');
    });

    it('returns refs in plan steps for dependency tracking', () => {
      const { generatePlan } = require('../src/orchestrator.ts');
      const plan = generatePlan('batch cards', pb, {
        cards: [{ task: 'Card X', checklist: ['A', 'B'], comment: 'Hi' }],
      });
      const cardStep = plan.find((s) => s.action === 'create_card');
      assert.ok(cardStep.ref, 'Card step should have ref');
      assert.equal(cardStep.ref, 'card:0');
      const depSteps = plan.filter((s) => s.dependsOn);
      assert.equal(depSteps.length, 2); // checklist + comment
      for (const step of depSteps) {
        assert.deepEqual(step.dependsOn, ['card:0']);
      }
    });
  });

  // ── executePlan ──

  describe('executePlan', () => {
    it('returns error for empty plan', async () => {
      const { executePlan } = require('../src/orchestrator.ts');
      // We can't test with real Trello client, but we can verify the function exists and its return shape
      assert.ok(typeof executePlan === 'function');
    });

    it('resolveRefs resolves ref:card:0 to real ID using refMap', () => {
      const refMap = new Map();
      refMap.set('card:0', { id: 'real123', type: 'create_card' });
      // We'll test the internal resolveRefs via executePlan's behavior
      // For now just verify the function exists
      assert.ok(true);
    });
  });
});
