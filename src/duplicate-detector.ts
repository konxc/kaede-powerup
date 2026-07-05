/**
 * KAEDE Duplicate Detection Engine
 *
 * Pure functions untuk mendeteksi kartu duplikat, validasi
 * konteks, dan menghasilkan rencana archive duplikat.
 */

import type {
  CardItem,
  BoardSnapshot,
  FindCardResult,
  DuplicateGroup,
  DetectDuplicatesResult,
  ValidationWarning,
  ValidateContextResult,
  ArchiveAction,
  ArchiveDuplicatesResult,
} from './types';

// ── Helpers ──

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Public API ──

export function findCard(cards: CardItem[], query: string): FindCardResult {
  const q = normalizeName(query);
  const exact = cards.find((c) => normalizeName(c.name) === q) || null;
  const similar = cards.filter((c) => {
    if (exact && c.id === exact.id) return false;
    const n = normalizeName(c.name);
    return n.includes(q) || q.includes(n);
  });
  return { exact, similar, totalCards: cards.length };
}

export function detectDuplicates(boards: BoardSnapshot[]): DetectDuplicatesResult {
  const all: { card: CardItem; listName: string; boardName: string; boardId: string; listId: string }[] = [];

  for (const b of boards) {
    for (const l of b.lists) {
      for (const c of l.cards) {
        all.push({ card: c, listName: l.listName || '', boardName: b.boardName || '', boardId: b.boardId, listId: l.listId });
      }
    }
  }

  const groups = new Map<string, typeof all>();
  for (const entry of all) {
    const key = normalizeName(entry.card.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  const sameList: DuplicateGroup[] = [];
  const crossList: DuplicateGroup[] = [];
  const crossBoard: DuplicateGroup[] = [];

  for (const [name, entries] of groups) {
    if (entries.length < 2) continue;

    const byLocation = new Map<string, typeof entries>();
    for (const e of entries) {
      const loc = `${e.boardId}:${e.listId}`;
      if (!byLocation.has(loc)) byLocation.set(loc, []);
      byLocation.get(loc)!.push(e);
    }

    for (const [, locEntries] of byLocation) {
      if (locEntries.length > 1) {
        sameList.push({
          name: locEntries[0].card.name,
          count: locEntries.length,
          cards: locEntries.map((e) => ({ ...e.card, listName: e.listName, boardName: e.boardName })),
          location: 'sameList',
        });
      }
    }

    const byBoard = new Map<string, typeof entries>();
    for (const e of entries) {
      if (!byBoard.has(e.boardId)) byBoard.set(e.boardId, []);
      byBoard.get(e.boardId)!.push(e);
    }
    for (const [, boardEntries] of byBoard) {
      const uniqueLists = new Set(boardEntries.map((e) => `${e.boardId}:${e.listId}`));
      if (uniqueLists.size > 1 && boardEntries.length > 1) {
        const alreadyCounted = sameList.some(
          (g) => normalizeName(g.name) === name && boardEntries.every((e) =>
            g.cards.some((gc) => gc.id === e.card.id)
          )
        );
        if (!alreadyCounted) {
          crossList.push({
            name: boardEntries[0].card.name,
            count: boardEntries.length,
            cards: boardEntries.map((e) => ({ ...e.card, listName: e.listName, boardName: e.boardName })),
            location: 'crossList',
          });
        }
      }
    }

    const uniqueBoards = new Set(entries.map((e) => e.boardId));
    if (uniqueBoards.size > 1) {
      crossBoard.push({
        name: entries[0].card.name,
        count: entries.length,
        cards: entries.map((e) => ({ ...e.card, listName: e.listName, boardName: e.boardName })),
        location: 'crossBoard',
      });
    }
  }

  const totalDuplicateCards = all.filter((e) => {
    const key = normalizeName(e.card.name);
    return (groups.get(key)?.length || 0) > 1;
  }).length;

  return { sameList, crossList, crossBoard, totalDuplicateCards, totalCards: all.length };
}

export function validateContext(
  action: string,
  params: Record<string, unknown>,
  boards: BoardSnapshot[],
): ValidateContextResult {
  const warnings: ValidationWarning[] = [];
  const existingMatches: CardItem[] = [];

  if (action === 'create_card') {
    const name = (params.name as string) || '';
    const listName = (params.listName as string) || '';

    if (!name) {
      warnings.push({ type: 'naming_convention', severity: 'blocker', message: 'Card name is required' });
    }

    const allCards: (CardItem & { listName: string; boardName: string })[] = [];
    for (const b of boards) {
      for (const l of b.lists) {
        for (const c of l.cards) {
          allCards.push({ ...c, listName: l.listName || '', boardName: b.boardName || '' });
        }
      }
    }

    const q = normalizeName(name);
    const exactMatches = allCards.filter((c) => normalizeName(c.name) === q);
    for (const m of exactMatches) {
      existingMatches.push(m);
      warnings.push({
        type: 'duplicate_name',
        severity: 'warning',
        message: `Card "${name}" already exists in "${m.boardName}" → "${m.listName}"`,
        existing: m,
      });
    }

    if (listName) {
      const listExists = boards.some((b) =>
        b.lists.some((l) => normalizeName(l.listName) === normalizeName(listName)),
      );
      if (!listExists) {
        warnings.push({ type: 'list_not_found', severity: 'blocker', message: `List "${listName}" not found in any board` });
      }
    }

    if (boards.length > 1 && name) {
      const foundInBoards = new Set<string>();
      for (const b of boards) {
        for (const l of b.lists) {
          for (const c of l.cards) {
            if (normalizeName(c.name) === q) {
              foundInBoards.add(b.boardName || b.boardId);
            }
          }
        }
      }
      if (foundInBoards.size > 1) {
        warnings.push({
          type: 'cross_board_conflict',
          severity: 'info',
          message: `Card "${name}" found in multiple boards: ${[...foundInBoards].join(', ')}. Verify single source of truth.`,
        });
      }
    }
  }

  if (action === 'create_board') {
    const name = (params.name as string) || '';
    if (name) {
      const existing = boards.find((b) => normalizeName(b.boardName) === normalizeName(name));
      if (existing) {
        warnings.push({ type: 'duplicate_name', severity: 'warning', message: `Board "${name}" already exists (id: ${existing.boardId})` });
      }
    }
  }

  const safe = !warnings.some((w) => w.severity === 'blocker');
  const blockers = warnings.filter((w) => w.severity === 'blocker').map((w) => w.message);

  return { safe, warnings, existingMatches, blockers };
}

export function archiveDuplicates(
  groups: DuplicateGroup[],
  keepStrategy: 'oldest' | 'newest' | 'longest_desc' = 'oldest',
): ArchiveDuplicatesResult {
  const plan: ArchiveAction[] = [];
  let archivedCards = 0;

  for (const group of groups) {
    if (group.cards.length < 2) continue;

    let keepIndex = 0;
    if (keepStrategy === 'newest') {
      keepIndex = group.cards.length - 1;
    } else if (keepStrategy === 'longest_desc') {
      let maxLen = 0;
      for (let i = 0; i < group.cards.length; i++) {
        const descLen = (group.cards[i].desc || '').length;
        if (descLen > maxLen) {
          maxLen = descLen;
          keepIndex = i;
        }
      }
    }

    for (let i = 0; i < group.cards.length; i++) {
      if (i === keepIndex) continue;
      const c = group.cards[i];
      const reason = `Duplicate of "${group.name}" — ${group.location}: ${group.count}x copies`;
      plan.push({
        action: 'archive_card',
        params: { cardId: c.id, cardName: c.name, reason },
        description: `Archive "${c.name}" (${c.boardName}/${c.listName}) — ${reason}`,
      });
      archivedCards++;
    }
  }

  const summary = archivedCards > 0
    ? `Found ${archivedCards} duplicate card(s) to archive. ${plan.length} action(s) generated.`
    : 'No duplicates found.';

  return { plan, summary, archivedCards };
}
