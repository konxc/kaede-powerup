/**
 * KAEDE Plan Handlers — Pattern-based intent → PlanStep mapping
 */

import type { BatchCard, TemplateVars, PlaybookResult, BoardSnapshot, PlanStep } from './types';
import { generateCardFromTemplate, getTemplate } from './templates';
import { inferFromGoal } from './prompter';
import { validateContext } from './duplicate-detector';
import { enforcePlaybook } from './enforcer';

interface PlanHandler {
  patterns: string[];
  fn: (pb: PlaybookResult, args: Record<string, unknown>, goal?: string) => Array<Record<string, unknown>>;
}

const planHandlers: PlanHandler[] = [];

function onPlan(patterns: string[], fn: PlanHandler['fn']): void {
  planHandlers.push({ patterns: patterns.map((p) => p.toLowerCase()), fn });
}

onPlan(['mulai sprint'], (pb, _args) => {
  return pb.workflow.lists.map((listName) => ({
    action: 'create_list',
    params: { name: listName },
    description: `Buat list "${listName}"`,
  }));
});

onPlan(['buat card', 'buat kartu', 'create card', 'tambah task', 'new task'], (pb, args) => {
  const name = (args.task as string) || (args.name as string) || 'New Task';
  const listName = (args.list as string) || pb.workflow.lists[0] || '';
  return [
    {
      action: 'create_card',
      params: { name, desc: args.desc || args.description || '', listName },
      description: `Buat card "${name}" di list "${listName}"`,
    },
  ];
});

onPlan(['assign', 'tugaskan', 'tambahkan anggota'], (_pb, args) => {
  return [
    {
      action: 'assign_member',
      params: { memberId: args.memberId || args.member || '', cardId: args.cardId || args.card || '' },
      description: `Assign anggota ${args.member || args.memberId || ''} ke card ${args.card || args.cardId || ''}`,
    },
  ];
});

onPlan(['tutup sprint', 'close sprint', 'archive sprint'], (_pb, _args) => {
  return [
    {
      action: 'close_sprint',
      params: {},
      description: 'Arsipkan semua card di list Done/Selesai/QA/Code Review',
    },
  ];
});

onPlan(['pindah semua', 'move all', 'pindahkan semua'], (_pb, args) => {
  return [
    {
      action: 'move_all_cards',
      params: { fromListName: args.dari || args.from || '', toListName: args.ke || args.to || '' },
      description: `Pindahkan semua card dari "${args.dari || args.from || ''}" ke "${args.ke || args.to || ''}"`,
    },
  ];
});

onPlan(['pindah', 'move card', 'pindahkan'], (_pb, args) => {
  return [
    {
      action: 'move_card',
      params: {
        cardName: args.cardId || args.card || '',
        listName: args.listName || '',
        listId: args.listId || args.list || '',
      },
      description: `Pindahkan card ke list ${args.listName || args.listId || ''}`,
    },
  ];
});

onPlan(['komentar', 'comment', 'tambah komentar'], (_pb, args) => {
  return [
    {
      action: 'add_comment',
      params: { cardName: args.cardId || args.card || '', text: args.text || args.comment || '' },
      description: `Tambah komentar ke card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['buat label', 'create label', 'tambah label baru'], (_pb, args) => {
  return [
    {
      action: 'create_label',
      params: { name: args.name || args.nama || '', color: args.color || args.warna || '' },
      description: `Buat label "${args.name || args.nama || ''}" warna ${args.color || args.warna || ''}`,
    },
  ];
});

onPlan(['arsip list', 'archive list', 'hapus list'], (_pb, args) => {
  return [
    {
      action: 'archive_list',
      params: { listName: args.nama || args.name || '', listId: args.listId || '' },
      description: `Arsipkan list "${args.nama || args.name || ''}"`,
    },
  ];
});

onPlan(['arsipkan', 'archive card', 'hapus card', 'delete card'], (_pb, args) => {
  return [
    {
      action: 'archive_card',
      params: { cardId: args.cardId || args.card || '' },
      description: `Arsipkan card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['update card', 'ubah kartu', 'edit card', 'update kartu'], (_pb, args) => {
  return [
    {
      action: 'update_card',
      params: { cardId: args.cardId || args.card || '', name: args.name, desc: args.description || args.desc },
      description: `Update card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['buat checklist', 'add checklist', 'tambah checklist'], (_pb, args) => {
  return [
    {
      action: 'create_checklist',
      params: {
        cardId: args.cardId || args.card || '',
        name: args.name || args.nama || 'Checklist',
        items: args.items || [],
      },
      description: `Buat checklist "${args.name || args.nama || 'Checklist'}" di card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['buat board', 'create board', 'new board'], (_pb, args) => {
  return [
    {
      action: 'create_board',
      params: { name: args.name || args.nama || 'New Board' },
      description: `Buat board "${args.name || args.nama || 'New Board'}"`,
    },
  ];
});

onPlan(['hapus anggota', 'remove member', 'keluarkan anggota'], (_pb, args) => {
  return [
    {
      action: 'remove_member',
      params: { cardId: args.cardId || args.card || '', memberId: args.memberId || args.member || '' },
      description: `Hapus anggota ${args.memberId || args.member || ''} dari card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['tambah label ke card', 'add label to card', 'pasang label'], (_pb, args) => {
  return [
    {
      action: 'add_label_to_card',
      params: { cardId: args.cardId || args.card || '', labelId: args.labelId || args.label || '' },
      description: `Pasang label ${args.labelId || args.label || ''} ke card ${args.cardId || args.card || ''}`,
    },
  ];
});

onPlan(['report', 'progress', 'my cards', 'kartu saya'], (_pb, _args) => {
  return [
    {
      action: 'report',
      params: {},
      description: 'Tampilkan laporan kartu yang ditugaskan',
    },
  ];
});

onPlan(['sprint report', 'generate report', 'laporan sprint', 'buat laporan'], (_pb, args) => {
  return [
    {
      action: 'sprint_report',
      params: {
        listNames: args.listNames || args.lists || [],
        sprint: args.sprint || args.name || 'Current Sprint',
      },
      description: `Generate sprint report: "${args.sprint as string || args.name as string || 'Current Sprint'}"`,
    },
  ];
});

onPlan(['undo', 'batalkan', 'rollback', 'kembalikan'], (_pb, _args) => {
  return [
    {
      action: 'undo',
      params: {},
      description: 'Batalkan eksekusi plan sebelumnya',
    },
  ];
});

onPlan(['batch update', 'update massal', 'batch pindah', 'batch move'], (_pb, args) => {
  return [
    {
      action: 'batch_update_cards',
      params: {
        filterList: args.filterList || args.fromList || '',
        toList: args.toList || args.moveTo || '',
        filterLabel: args.filterLabel || '',
        memberId: args.memberId || '',
        dueBefore: args.dueBefore || '',
        dueAfter: args.dueAfter || '',
        setName: args.setName || '',
        setDesc: args.setDesc || args.setDescription || '',
        setDue: args.setDue || '',
        setStart: args.setStart || '',
        addLabels: args.addLabels || [],
        removeLabels: args.removeLabels || [],
      },
      description: `Batch update cards from "${args.fromList || args.filterList || '(all)'}"`,
    },
  ];
});

// ── Template Filler Helper ──

function fillCardFromTemplate(card: BatchCard, args: Record<string, unknown>, goal?: string): BatchCard {
  const templateName = (args.template as string) || '';
  const resolved = { ...card };

  if (resolved.desc && resolved.checklist?.length && (resolved.comment || resolved.checklist.length > 0)) {
    return resolved;
  }

  let tplName = templateName;
  if (!tplName && goal) {
    const inference = inferFromGoal(goal);
    tplName = inference.templateName || '';
  }

  if (!tplName) return resolved;
  const template = getTemplate(tplName);
  if (!template) return resolved;

  const vars: TemplateVars = {
    task: card.task,
    role: (args.role as string) || 'user',
    want: (args.want as string) || 'this feature',
    benefit: (args.benefit as string) || '',
    feature: (args.feature as string) || '',
    techStack: (args.techStack as string) || '',
    convention: (args.convention as string) || '',
    reference: (args.reference as string) || '',
    priority: (args.priority as string) || '',
    assignee: (args.assignee as string) || '',
  };

  const generated = generateCardFromTemplate(template, vars);

  if (!resolved.desc) resolved.desc = generated.description;
  if (!resolved.checklist || resolved.checklist.length === 0) resolved.checklist = generated.checklist;
  if (!resolved.comment) resolved.comment = generated.comment || '';
  if (!resolved.labels || resolved.labels.length === 0) resolved.labels = generated.labels;

  return resolved;
}

// ── Composite Plan Handlers (Batch, Multi-board) ──

onPlan(['setup sprint', 'set up sprint', 'mulai sprint baru'], (pb, args) => {
  const steps: PlanStep[] = [];
  const boardsInput = (args.boards as Array<Record<string, unknown>>) || [];
  const rawCardsInput = (args.cards as BatchCard[]) || [];
  const boardNames = (args.boardNames as string[]) || boardsInput.map((b) => b.boardName as string) || [''];

  const goal = (args.goal as string) || '';
  const cardsInput = rawCardsInput.map((c) => fillCardFromTemplate(c, args, goal));

  for (let bi = 0; bi < boardNames.length; bi++) {
    const bName = boardNames[bi];
    const listRef = `lists:${bi}`;

    let ci = 0;
    for (const listName of pb.workflow.lists) {
      steps.push({
        action: 'create_list',
        params: { name: listName, boardName: bName },
        description: `Buat list "${listName}" di ${bName}`,
        ref: `${listRef}:${ci}`,
      });
      ci++;
    }

    const boardCards = cardsInput.filter((c) => !c.list || boardsInput.length <= 1);
    for (let k = 0; k < boardCards.length; k++) {
      const card = boardCards[k];
      const cardRef = `card:${bi}:${k}`;
      const targetList = card.list || pb.workflow.lists[0] || '';

      steps.push({
        action: 'create_card',
        params: {
          name: card.task,
          desc: card.desc || '',
          listName: targetList,
          boardName: bName,
          start: card.start || '',
          due: card.due || '',
          labels: card.labels || [],
        },
        description: `Buat card "${card.task}" di ${bName}/${targetList}`,
        ref: cardRef,
      });

      if (card.checklist && card.checklist.length > 0) {
        steps.push({
          action: 'create_checklist',
          params: { cardId: `ref:${cardRef}`, name: 'Acceptance Criteria', items: card.checklist },
          description: `Buat checklist Acceptance Criteria untuk "${card.task}"`,
          dependsOn: [cardRef],
        });
      }

      if (card.comment) {
        steps.push({
          action: 'add_comment',
          params: { cardId: `ref:${cardRef}`, text: card.comment },
          description: `Tambah komentar untuk "${card.task}"`,
          dependsOn: [cardRef],
        });
      }
    }
  }

  return steps;
});

onPlan(['buat cards batch', 'batch cards', 'create batch'], (_pb, args) => {
  const rawCardsInput = (args.cards as BatchCard[]) || [];
  const goal = (args.goal as string) || '';
  const cardsInput = rawCardsInput.map((c) => fillCardFromTemplate(c, args, goal));
  const boardName = (args.boardName as string) || '';
  const listName = (args.list as string) || (args.listName as string) || 'Sprint';

  const steps: PlanStep[] = [];
  for (let i = 0; i < cardsInput.length; i++) {
    const card = cardsInput[i];
    const cardRef = `card:${i}`;

    steps.push({
      action: 'create_card',
      params: {
        name: card.task,
        desc: card.desc || '',
        listName: card.list || listName,
        boardName: boardName,
        start: card.start || '',
        due: card.due || '',
        labels: card.labels || [],
      },
      description: `Buat card "${card.task}"`,
      ref: cardRef,
    });

    if (card.checklist && card.checklist.length > 0) {
      steps.push({
        action: 'create_checklist',
        params: { cardId: `ref:${cardRef}`, name: 'Acceptance Criteria', items: card.checklist },
        description: `Buat checklist untuk "${card.task}"`,
        dependsOn: [cardRef],
      });
    }

    if (card.comment) {
      steps.push({
        action: 'add_comment',
        params: { cardId: `ref:${cardRef}`, text: card.comment },
        description: `Tambah komentar untuk "${card.task}"`,
        dependsOn: [cardRef],
      });
    }
  }
  return steps;
});

onPlan(['setup labels batch', 'batch labels', 'create labels batch'], (_pb, args) => {
  const labels = (args.labels as Array<{ name: string; color: string }>) || [];
  const boardName = (args.boardName as string) || '';

  return labels.map((l, i) => ({
    action: 'create_label',
    params: { name: l.name, color: l.color, boardName },
    description: `Buat label "${l.name}" (${l.color})`,
    ref: `label:${i}`,
  }));
});

// ── Pre-flight Validation ──

function runPreFlight(
  plan: Array<Record<string, unknown>>,
  boards: BoardSnapshot[],
  playbook?: PlaybookResult,
): Array<Record<string, unknown>> {
  const steps: Array<Record<string, unknown>> = [];

  for (const step of plan) {
    const action = step.action as string;
    if (action === 'create_card' || action === 'create_label') {
      const result = validateContext(action, step.params as Record<string, unknown>, boards);

      if (result.warnings.length > 0 || result.blockers.length > 0) {
        steps.push({
          action: 'pre_flight_check',
          params: {
            targetAction: action,
            targetParams: step.params,
            safe: result.safe,
            warnings: result.warnings,
            blockers: result.blockers,
          },
          description: result.blockers.length > 0
            ? `BLOCKER: ${result.blockers.join('; ')}`
            : `Warning: ${result.warnings.map((w) => w.message).join('; ')}`,
          preFlight: { safe: result.safe, warnings: result.warnings, blockers: result.blockers },
        });
      }
    }
  }

  if (playbook) {
    const typedPlan = plan as PlanStep[];
    const enforceResult = enforcePlaybook(typedPlan, playbook, boards);

    if (enforceResult.warnings.length > 0) {
      for (const w of enforceResult.warnings) {
        steps.push({
          action: 'enforcement_check',
          params: {
            rule: w.rule,
            severity: w.severity,
            message: w.message,
            actual: w.actual,
            expected: w.expected,
          },
          description: w.severity === 'blocker'
            ? `BLOCKER: ${w.message}`
            : `Enforcement: ${w.message}`,
          enforcement: w,
        });
      }
    }
  }

  return steps;
}

export { planHandlers, runPreFlight, PlanHandler };
