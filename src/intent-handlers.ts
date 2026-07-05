/**
 * KAEDE Intent Handlers
 *
 * Menerjemahkan intent bahasa alami pengguna menjadi aksi Trello
 * melalui fungsi handler yang terdaftar di `intentHandlers[]`.
 */

import { TrelloMCPClient } from './trello-client';
import { getErrorMessage } from './types';
import type { BatchCard, BatchUpdateFilter, BatchUpdateOperation, PlaybookResult, IntentResult } from './types';
import { generateSprintReport } from './report-generator';
import { batchUpdateCards } from './batch-updater';
import { undoLastPlan } from './plan-executor';

interface IntentHandler {
  patterns: string[];
  fn: (
    client: TrelloMCPClient,
    pb: PlaybookResult,
    boardId: string,
    args?: Record<string, unknown>,
  ) => Promise<unknown[]>;
}

const intentHandlers: IntentHandler[] = [];

function onIntent(patterns: string[], fn: IntentHandler['fn']): void {
  intentHandlers.push({ patterns: patterns.map((p) => p.toLowerCase()), fn });
}

onIntent(['mulai sprint'], async (client, pb, boardId) => {
  const results: IntentResult[] = [];
  for (const listName of pb.workflow.lists) {
    try {
      const r = await client.createList(boardId, listName);
      results.push({ success: true, type: 'create_list', name: listName, result: r });
    } catch (err) {
      results.push({ success: false, type: 'create_list', name: listName, error: getErrorMessage(err) });
    }
  }
  return results;
});

onIntent(['buat card', 'buat kartu', 'create card', 'tambah task', 'new task'], async (client, pb, boardId, args) => {
  const name = (args?.task as string) || (args?.name as string) || 'New Task';
  const desc = (args?.desc as string) || (args?.description as string) || '';
  const listName = (args?.list as string) || pb.workflow.lists[0];
  const listId = (args?.listId as string) || '';

  if (listId) {
    try {
      const r = await client.createCard(listId, name, desc);
      return [{ success: true, type: 'create_card', name: (r as Record<string, unknown>).name as string }];
    } catch (err) {
      return [{ success: false, type: 'create_card', name, error: getErrorMessage(err) }];
    }
  }

  const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
  const target = lists.find((l) => (l.name as string).toLowerCase() === (listName || '').toLowerCase());
  if (!target) {
    return [{ success: false, type: 'create_card', name, error: `List "${listName}" not found` }];
  }
  try {
    const r = await client.createCard(target.id as string, name, desc);
    return [{ success: true, type: 'create_card', name: (r as Record<string, unknown>).name as string }];
  } catch (err) {
    return [{ success: false, type: 'create_card', name, error: getErrorMessage(err) }];
  }
});

onIntent(['assign', 'tugaskan', 'tambahkan anggota'], async (client, _pb, _boardId, args) => {
  const memberId = (args?.memberId as string) || (args?.member as string) || '';
  const cardId = (args?.cardId as string) || (args?.card as string) || '';

  if (!memberId || !cardId) {
    return [{ success: false, type: 'assign_member', name: 'missing args', error: 'memberId and cardId required' }];
  }
  try {
    await client.assignMember(cardId, memberId);
    return [{ success: true, type: 'assign_member', name: `Member ${memberId} → Card ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'assign_member', name: `${memberId} → ${cardId}`, error: getErrorMessage(err) }];
  }
});

onIntent(['tutup sprint', 'close sprint', 'archive sprint'], async (client, _pb, boardId) => {
  const results: IntentResult[] = [];
  const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
  const toArchive = lists.filter((l) =>
    ['done', 'selesai', 'qa', 'code review', 'qa/code review'].some((k) =>
      (l.name as string).toLowerCase().includes(k),
    ),
  );
  for (const list of toArchive) {
    try {
      const cards = (await client.callTool('get_cards_by_list_id', { listId: list.id })) as {
        cards?: Array<Record<string, unknown>>;
      };
      for (const card of cards.cards || []) {
        try {
          await client.callTool('archive_card', { cardId: card.id });
          results.push({ success: true, type: 'archive_card', name: card.name as string });
        } catch (err) {
          results.push({
            success: false,
            type: 'archive_card',
            name: card.name as string,
            error: getErrorMessage(err),
          });
        }
      }
    } catch (err) {
      results.push({ success: false, type: 'get_cards', name: list.name as string, error: getErrorMessage(err) });
    }
  }
  return results;
});

onIntent(['pindah semua', 'move all', 'pindahkan semua'], async (client, _pb, boardId, args) => {
  const fromListName = (args?.dari as string) || (args?.from as string) || (args?.listName as string) || '';
  const toListName = (args?.ke as string) || (args?.to as string) || (args?.listNameTarget as string) || '';

  if (!fromListName || !toListName) {
    return [{ success: false, type: 'move_all_cards', name: 'missing args', error: 'from and to list names required' }];
  }

  try {
    const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
    const fromList = lists.find((l) => (l.name as string).toLowerCase().includes(fromListName.toLowerCase()));
    const toList = lists.find((l) => (l.name as string).toLowerCase().includes(toListName.toLowerCase()));
    if (!fromList)
      return [
        { success: false, type: 'move_all_cards', name: fromListName, error: `List "${fromListName}" not found` },
      ];
    if (!toList)
      return [{ success: false, type: 'move_all_cards', name: toListName, error: `List "${toListName}" not found` }];

    const cards = (await client.getCardsByListId(fromList.id as string, boardId)) as Array<Record<string, unknown>>;
    const results: IntentResult[] = [];
    for (const card of cards) {
      try {
        await client.callTool('move_card', { cardId: card.id, listId: toList.id });
        results.push({ success: true, type: 'move_card', name: card.name as string });
      } catch (err) {
        results.push({ success: false, type: 'move_card', name: card.name as string, error: getErrorMessage(err) });
      }
    }
    return results;
  } catch (err) {
    return [{ success: false, type: 'move_all_cards', name: fromListName, error: getErrorMessage(err) }];
  }
});

onIntent(['pindah', 'move card', 'pindahkan'], async (client, _pb, boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const listId = (args?.listId as string) || (args?.list as string) || '';
  const listName = (args?.listName as string) || '';

  if (!cardId || (!listId && !listName)) {
    return [{ success: false, type: 'move_card', name: 'missing args', error: 'cardId and listId/listName required' }];
  }

  let targetListId = listId;
  if (!targetListId && listName) {
    const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
    const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
    if (!target) return [{ success: false, type: 'move_card', name: cardId, error: `List "${listName}" not found` }];
    targetListId = target.id as string;
  }

  try {
    await client.callTool('move_card', { cardId, listId: targetListId });
    return [{ success: true, type: 'move_card', name: `Card ${cardId} → List ${targetListId}` }];
  } catch (err) {
    return [{ success: false, type: 'move_card', name: cardId, error: getErrorMessage(err) }];
  }
});

onIntent(['komentar', 'comment', 'tambah komentar'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const text = (args?.text as string) || (args?.comment as string) || '';

  if (!cardId || !text) {
    return [{ success: false, type: 'add_comment', name: 'missing args', error: 'cardId and text required' }];
  }
  try {
    await client.callTool('add_comment', { cardId, text });
    return [{ success: true, type: 'add_comment', name: `Comment on ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'add_comment', name: cardId, error: getErrorMessage(err) }];
  }
});

onIntent(['buat label', 'create label', 'tambah label baru'], async (client, _pb, boardId, args) => {
  const colorName = (args?.color as string) || (args?.warna as string) || '';
  const labelName = (args?.name as string) || (args?.nama as string) || '';
  let targetColor = colorName.toLowerCase();

  const colorMap: Record<string, string> = {
    merah: 'red',
    kuning: 'yellow',
    hijau: 'green',
    biru: 'blue',
    orange: 'orange',
    ungu: 'purple',
    pink: 'pink',
    abu: 'gray',
    red: 'red',
    yellow: 'yellow',
    green: 'green',
    blue: 'blue',
    purple: 'purple',
    gray: 'gray',
  };
  targetColor = colorMap[targetColor] || targetColor;

  const validColors = ['red', 'yellow', 'green', 'blue', 'orange', 'purple', 'pink', 'gray'];
  if (!targetColor || !validColors.includes(targetColor)) {
    return [
      {
        success: false,
        type: 'create_label',
        name: labelName || '(no name)',
        error: `Invalid color "${colorName}". Gunakan: merah/kuning/hijau/biru/orange/ungu/pink/abu`,
      },
    ];
  }

  const displayName = labelName || targetColor;
  try {
    const r = await client.createLabel(boardId, displayName, targetColor);
    return [{ success: true, type: 'create_label', name: displayName, result: r }];
  } catch (err) {
    return [{ success: false, type: 'create_label', name: displayName, error: getErrorMessage(err) }];
  }
});

onIntent(['arsip list', 'archive list', 'hapus list'], async (client, _pb, boardId, args) => {
  const listName = (args?.nama as string) || (args?.name as string) || '';
  const listId = (args?.listId as string) || '';

  if (!listId && !listName) {
    return [{ success: false, type: 'archive_list', name: 'missing args', error: 'listId or name required' }];
  }

  let targetListId = listId;
  if (!targetListId && listName) {
    const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
    const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
    if (!target)
      return [{ success: false, type: 'archive_list', name: listName, error: `List "${listName}" not found` }];
    targetListId = target.id as string;
  }

  try {
    await client.archiveList(targetListId);
    return [{ success: true, type: 'archive_list', name: `List ${listName || targetListId} archived` }];
  } catch (err) {
    return [{ success: false, type: 'archive_list', name: listName, error: getErrorMessage(err) }];
  }
});

onIntent(['arsipkan', 'archive card', 'hapus card', 'delete card'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  if (!cardId) {
    return [{ success: false, type: 'archive_card', name: 'missing args', error: 'cardId required' }];
  }
  try {
    await client.archiveCard(cardId);
    return [{ success: true, type: 'archive_card', name: `Archived ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'archive_card', name: cardId, error: getErrorMessage(err) }];
  }
});

onIntent(['update card', 'ubah kartu', 'edit card', 'update kartu'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  if (!cardId) {
    return [{ success: false, type: 'update_card', name: 'missing args', error: 'cardId required' }];
  }

  const updates: Record<string, unknown> = {};
  if (args?.name) updates.name = args.name;
  if (args?.description || args?.desc) updates.description = args.description || args.desc;
  if (args?.dueDate) updates.dueDate = args.dueDate;
  if (args?.start) updates.start = args.start;
  if (args?.dueComplete !== undefined) updates.dueComplete = args.dueComplete;
  if (args?.labels) updates.labels = args.labels;

  try {
    await client.updateCard(cardId, updates);
    return [{ success: true, type: 'update_card', name: `Card ${cardId} updated` }];
  } catch (err) {
    return [{ success: false, type: 'update_card', name: cardId, error: getErrorMessage(err) }];
  }
});

onIntent(['buat checklist', 'add checklist', 'tambah checklist'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const name = (args?.name as string) || (args?.nama as string) || 'Checklist';
  const items = (args?.items as string[]) || [];

  if (!cardId) {
    return [{ success: false, type: 'create_checklist', name: 'missing args', error: 'cardId required' }];
  }

  try {
    const r = (await client.createChecklist(cardId, name)) as Record<string, unknown>;
    const results: IntentResult[] = [{ success: true, type: 'create_checklist', name: r.name as string, result: r }];
    for (const item of items) {
      try {
        const ir = await client.addChecklistItem(r.id as string, item);
        results.push({ success: true, type: 'add_checklist_item', name: item, result: ir });
      } catch (err) {
        results.push({ success: false, type: 'add_checklist_item', name: item, error: getErrorMessage(err) });
      }
    }
    return results;
  } catch (err) {
    return [{ success: false, type: 'create_checklist', name, error: getErrorMessage(err) }];
  }
});

onIntent(['buat board', 'create board', 'new board'], async (client, _pb, _boardId, args) => {
  const name = (args?.name as string) || (args?.nama as string) || 'New Board';
  try {
    const r = await client.createBoard(name, {});
    return [{ success: true, type: 'create_board', name, result: r }];
  } catch (err) {
    return [{ success: false, type: 'create_board', name, error: getErrorMessage(err) }];
  }
});

onIntent(['hapus anggota', 'remove member', 'keluarkan anggota'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const memberId = (args?.memberId as string) || (args?.member as string) || '';
  if (!cardId || !memberId) {
    return [{ success: false, type: 'remove_member', name: 'missing args', error: 'cardId and memberId required' }];
  }
  try {
    await client.removeMember(cardId, memberId);
    return [{ success: true, type: 'remove_member', name: `${memberId} removed from ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'remove_member', name: cardId, error: getErrorMessage(err) }];
  }
});

onIntent(['tambah label ke card', 'add label to card', 'pasang label'], async (client, _pb, _boardId, args) => {
  const cardId = (args?.cardId as string) || (args?.card as string) || '';
  const labelId = (args?.labelId as string) || (args?.label as string) || '';
  if (!cardId || !labelId) {
    return [{ success: false, type: 'add_label_to_card', name: 'missing args', error: 'cardId and labelId required' }];
  }
  try {
    await client.addLabelToCard(cardId, labelId);
    return [{ success: true, type: 'add_label_to_card', name: `Label ${labelId} → Card ${cardId}` }];
  } catch (err) {
    return [{ success: false, type: 'add_label_to_card', name: cardId, error: getErrorMessage(err) }];
  }
});

onIntent(['report', 'progress', 'my cards', 'kartu saya'], async (client, _pb, _boardId) => {
  try {
    const r = (await client.callTool('get_my_cards', {})) as { cards?: Array<Record<string, unknown>> };
    const cards = r.cards || [];
    const grouped: Record<string, unknown[]> = {};
    for (const c of cards) {
      const listName = (c.listId as string) || 'Unknown';
      if (!grouped[listName]) grouped[listName] = [];
      grouped[listName].push(c);
    }
    return [{ success: true, type: 'report', name: `Found ${cards.length} cards assigned to you`, detail: grouped }];
  } catch (err) {
    return [{ success: false, type: 'report', name: 'failed', error: getErrorMessage(err) }];
  }
});

onIntent(['sprint report', 'generate report', 'laporan sprint', 'buat laporan'], async (client, _pb, boardId, args) => {
  const listNames = (args.listNames as string[]) || (args.lists as string[]) || [];
  const sprintName = (args.sprint as string) || (args.name as string) || 'Current Sprint';
  try {
    const report = await generateSprintReport(client, boardId, listNames, sprintName);
    return [{ success: true, type: 'sprint_report', name: sprintName, detail: report, result: { markdown: report.markdown } }];
  } catch (err) {
    return [{ success: false, type: 'sprint_report', name: sprintName, error: getErrorMessage(err) }];
  }
});

onIntent(['undo', 'batalkan', 'rollback', 'kembalikan'], async (client, _pb, _boardId) => {
  try {
    const result = await undoLastPlan(client);
    return [{
      success: result.success,
      type: 'undo',
      name: `Undo ${result.undoneSteps} steps`,
      detail: result,
      error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
    }];
  } catch (err) {
    return [{ success: false, type: 'undo', name: 'failed', error: getErrorMessage(err) }];
  }
});

onIntent(['batch update', 'update massal', 'batch pindah', 'batch move'], async (client, _pb, boardId, args) => {
  const filter: BatchUpdateFilter = {
    listName: (args.filterList as string) || (args.fromList as string) || '',
    labelName: (args.filterLabel as string) || '',
    memberId: (args.memberId as string) || '',
    dueBefore: (args.dueBefore as string) || '',
    dueAfter: (args.dueAfter as string) || '',
  };
  const operation: BatchUpdateOperation = {
    moveToListName: (args.toList as string) || (args.moveTo as string) || '',
    addLabels: (args.addLabels as string[]) || [],
    removeLabels: (args.removeLabels as string[]) || [],
    setName: (args.setName as string) || '',
    setDescription: (args.setDesc as string) || (args.setDescription as string) || '',
    setDue: (args.setDue as string) || '',
    setStart: (args.setStart as string) || '',
  };

  if (!filter.listName && !operation.moveToListName && !operation.setName) {
    return [{ success: false, type: 'batch_update', name: 'missing args', error: 'filterList or toList required' }];
  }

  try {
    const result = await batchUpdateCards(client, boardId, filter, operation);
    return [{
      success: result.errors.length === 0,
      type: 'batch_update',
      name: `Updated ${result.updated} cards`,
      detail: result,
      error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
    }];
  } catch (err) {
    return [{ success: false, type: 'batch_update', name: 'failed', error: getErrorMessage(err) }];
  }
});

// ── Composite Intent Handlers ──

onIntent(['setup sprint', 'set up sprint', 'mulai sprint baru'], async (client, pb, _boardId, args) => {
  const results: IntentResult[] = [];
  const boardsInput = (args.boards as Array<{ boardId: string; boardName: string }>) || [];
  const cardsInput = (args.cards as BatchCard[]) || [];

  for (const board of boardsInput) {
    const bid = board.boardId;

    for (const listName of pb.workflow.lists) {
      try {
        const r = await client.createList(bid, listName);
        results.push({ success: true, type: 'create_list', name: listName, result: r });
      } catch (err) {
        results.push({ success: false, type: 'create_list', name: listName, error: getErrorMessage(err) });
      }
    }

    const lists = (await client.getLists(bid)) as Array<Record<string, unknown>>;

    for (const card of cardsInput) {
      const listName = card.list || pb.workflow.lists[0] || '';
      const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
      if (!target) {
        results.push({ success: false, type: 'create_card', name: card.task, error: `List "${listName}" not found` });
        continue;
      }

      try {
        const r = (await client.createCard(target.id as string, card.task, card.desc || '')) as Record<string, unknown>;
        const cardId = r.id as string;
        results.push({ success: true, type: 'create_card', name: card.task, result: { id: cardId } });

        if (card.start || card.due) {
          const updates: Record<string, unknown> = {};
          if (card.start) updates.start = card.start;
          if (card.due) updates.due = card.due;
          try { await client.updateCard(cardId, updates); } catch {}
        }

        if (card.checklist && card.checklist.length > 0) {
          try {
            const cl = (await client.createChecklist(cardId, 'Acceptance Criteria')) as Record<string, unknown>;
            results.push({ success: true, type: 'create_checklist', name: 'Acceptance Criteria', result: { id: cl.id } });
            for (const item of card.checklist) {
              try {
                await client.addChecklistItem(cl.id as string, item);
                results.push({ success: true, type: 'add_checklist_item', name: item });
              } catch (err) {
                results.push({ success: false, type: 'add_checklist_item', name: item, error: getErrorMessage(err) });
              }
            }
          } catch (err) {
            results.push({ success: false, type: 'create_checklist', name: 'Acceptance Criteria', error: getErrorMessage(err) });
          }
        }

        if (card.comment) {
          try {
            await client.addComment(cardId, card.comment);
            results.push({ success: true, type: 'add_comment', name: `Comment on ${card.task}` });
          } catch (err) {
            results.push({ success: false, type: 'add_comment', name: card.task, error: getErrorMessage(err) });
          }
        }
      } catch (err) {
        results.push({ success: false, type: 'create_card', name: card.task, error: getErrorMessage(err) });
      }
    }
  }
  return results;
});

onIntent(['buat cards batch', 'batch cards', 'create batch'], async (client, pb, boardId, args) => {
  const results: IntentResult[] = [];
  const cardsInput = (args.cards as BatchCard[]) || [];
  const listName = (args.list as string) || (args.listName as string) || pb.workflow.lists[0] || '';

  const lists = (await client.getLists(boardId)) as Array<Record<string, unknown>>;
  const target = lists.find((l) => (l.name as string).toLowerCase() === listName.toLowerCase());
  if (!target) {
    return [{ success: false, type: 'batch_cards', name: listName, error: `List "${listName}" not found` }];
  }

  for (const card of cardsInput) {
    try {
      const r = (await client.createCard(target.id as string, card.task, card.desc || '')) as Record<string, unknown>;
      const cardId = r.id as string;
      results.push({ success: true, type: 'create_card', name: card.task, result: { id: cardId } });

      if (card.start || card.due) {
        const updates: Record<string, unknown> = {};
        if (card.start) updates.start = card.start;
        if (card.due) updates.due = card.due;
        try { await client.updateCard(cardId, updates); } catch {}
      }

      if (card.checklist && card.checklist.length > 0) {
        try {
          const cl = (await client.createChecklist(cardId, 'Acceptance Criteria')) as Record<string, unknown>;
          for (const item of card.checklist) {
            try { await client.addChecklistItem(cl.id as string, item); } catch {}
          }
        } catch {}
      }

      if (card.comment) {
        try { await client.addComment(cardId, card.comment); } catch {}
      }
    } catch (err) {
      results.push({ success: false, type: 'create_card', name: card.task, error: getErrorMessage(err) });
    }
  }
  return results;
});

onIntent(['setup labels batch', 'batch labels', 'create labels batch'], async (client, _pb, boardId, args) => {
  const results: IntentResult[] = [];
  const labels = (args.labels as Array<{ name: string; color: string }>) || [];

  for (const label of labels) {
    try {
      const r = await client.createLabel(boardId, label.name, label.color);
      results.push({ success: true, type: 'create_label', name: label.name, result: r });
    } catch (err) {
      results.push({ success: false, type: 'create_label', name: label.name, error: getErrorMessage(err) });
    }
  }
  return results;
});

// ── Execute Intent ──

export async function executeIntent(
  client: TrelloMCPClient,
  intent: string,
  playbookContext: PlaybookResult,
  boardId: string,
  extraArgs: Record<string, unknown> = {},
): Promise<unknown[]> {
  const lower = intent.toLowerCase();
  for (const h of intentHandlers) {
    if (h.patterns.some((p) => lower.includes(p))) {
      return h.fn(client, playbookContext, boardId, extraArgs);
    }
  }
  return [
    {
      success: false,
      type: 'unknown_intent',
      name: intent,
      error:
        'No handler matched. Try: mulai sprint, buat card, assign, buat label, arsipkan, arsip list, pindah semua, buat board, update card, buat checklist, komentar, report, tutup sprint, undo, batch update, sprint report',
    },
  ];
}
