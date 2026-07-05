/**
 * KAEDE Sprint Report Generator
 *
 * Mengambil data dari Trello board dan menghasilkan
 * laporan sprint dalam format markdown.
 */

import type { ITrelloMCPClient } from './trello-client.interface';
import type { SprintReport, SprintCardData } from './types';

export async function generateSprintReport(
  client: ITrelloMCPClient,
  boardId: string,
  listNames: string[],
  sprintName?: string,
): Promise<SprintReport> {
  const lists = await client.getLists(boardId) as Array<Record<string, unknown>>;
  const targetLists = listNames.length > 0
    ? lists.filter((l) => listNames.some((n) => (l.name as string).toLowerCase().includes(n.toLowerCase())))
    : lists;

  const allCards: SprintCardData[] = [];
  const listCardMap: Record<string, SprintCardData[]> = {};

  for (const list of targetLists) {
    const cards = await client.getCardsByListId(list.id as string, boardId) as Array<Record<string, unknown>>;
    const listName = list.name as string;
    listCardMap[listName] = [];

    for (const c of cards) {
      const cardData: SprintCardData = {
        id: c.id as string,
        name: c.name as string,
        listName,
        due: c.due as string | undefined,
        dueComplete: c.dueComplete as boolean | undefined,
        start: c.start as string | undefined,
        desc: c.desc as string | undefined,
        url: c.url as string | undefined,
        dateLastActivity: c.dateLastActivity as string | undefined,
      };

      try {
        const detailed = await client.getCard(c.id as string) as Record<string, unknown>;
        if (detailed.labels) {
          cardData.labels = (detailed.labels as Array<Record<string, unknown>>).map((l) => ({
            id: l.id as string,
            name: l.name as string,
            color: l.color as string,
          }));
        }
      } catch {}

      allCards.push(cardData);
      listCardMap[listName].push(cardData);
    }
  }

  const now = new Date();
  const overdueCount = allCards.filter((c) => c.due && !c.dueComplete && new Date(c.due) < now).length;
  const completedCount = allCards.filter((c) => c.dueComplete).length;

  const groupedByLabel: Record<string, number> = {};
  for (const c of allCards) {
    if (c.labels) {
      for (const l of c.labels) {
        const key = l.name || l.color;
        groupedByLabel[key] = (groupedByLabel[key] || 0) + 1;
      }
    }
  }

  const boardName = (await client.getCard(boardId).catch(() => ({})) as Record<string, unknown>).name as string || 'Board';

  const lines: string[] = [];
  lines.push(`# Sprint Report: ${sprintName || 'Current Sprint'}`);
  lines.push(`**Board:** ${boardName}`);
  lines.push(`**Generated:** ${now.toISOString().slice(0, 10)}`);
  lines.push(`**Total Cards:** ${allCards.length}`);
  lines.push(`**Overdue:** ${overdueCount}`);
  lines.push(`**Completed:** ${completedCount}`);
  lines.push('');

  for (const [lName, cards] of Object.entries(listCardMap)) {
    lines.push(`## ${lName} (${cards.length})`);
    for (const c of cards) {
      const dueStr = c.due ? ` [${new Date(c.due).toISOString().slice(0, 10)}${c.dueComplete ? ' ✓' : ''}]` : '';
      const labelStr = c.labels?.length ? ` \`${c.labels.map((l) => l.name || l.color).join(', ')}\`` : '';
      lines.push(`- ${c.name}${dueStr}${labelStr}`);
    }
    lines.push('');
  }

  if (Object.keys(groupedByLabel).length > 0) {
    lines.push('## Cards by Label');
    for (const [label, count] of Object.entries(groupedByLabel).sort((a, b) => b[1] - a[1])) {
      lines.push(`- **${label}**: ${count}`);
    }
    lines.push('');
  }

  return {
    boardName,
    sprintName: sprintName || 'Current Sprint',
    generatedAt: now.toISOString(),
    totalCards: allCards.length,
    lists: targetLists.map((l) => ({
      listName: l.name as string,
      cardCount: listCardMap[l.name as string]?.length || 0,
      cards: listCardMap[l.name as string] || [],
    })),
    groupedByLabel,
    overdueCount,
    completedCount,
    memberStats: [],
    markdown: lines.join('\n'),
  };
}
