/**
 * KAEDE Batch Card Updater
 *
 * Update/move multiple Trello cards based on filters and operations.
 */

import type { ITrelloMCPClient } from './trello-client.interface';
import type { BatchUpdateFilter, BatchUpdateOperation } from './types';
import { getErrorMessage } from './types';

export async function batchUpdateCards(
  client: ITrelloMCPClient,
  boardId: string,
  filter: BatchUpdateFilter,
  operation: BatchUpdateOperation,
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  const lists = await client.getLists(boardId) as Array<Record<string, unknown>>;
  let targetLists = lists;

  if (filter.listName) {
    targetLists = lists.filter((l) => (l.name as string).toLowerCase().includes(filter.listName!.toLowerCase()));
  }

  for (const list of targetLists) {
    const cards = await client.getCardsByListId(list.id as string, boardId) as Array<Record<string, unknown>>;

    for (const card of cards) {
      if (filter.memberId) {
        const idMembers = card.idMembers as string | string[] | undefined;
        const memberIds = Array.isArray(idMembers) ? idMembers : [];
        if (!memberIds.includes(filter.memberId)) continue;
      }

      if (filter.dueBefore || filter.dueAfter) {
        const due = card.due as string | undefined;
        if (!due) continue;
        const dueDate = new Date(due);
        if (filter.dueBefore && dueDate >= new Date(filter.dueBefore)) continue;
        if (filter.dueAfter && dueDate <= new Date(filter.dueAfter)) continue;
      }

      try {
        const updates: Record<string, unknown> = {};

        if (operation.setName) updates.name = operation.setName.replace('{{name}}', card.name as string);
        if (operation.setDescription) updates.description = operation.setDescription;
        if (operation.setDue) updates.dueDate = operation.setDue;
        if (operation.setStart) updates.start = operation.setStart;

        if (Object.keys(updates).length > 0) {
          await client.updateCard(card.id as string, updates);
        }

        if (operation.moveToListName) {
          const targetList = lists.find((l) =>
            (l.name as string).toLowerCase() === operation.moveToListName!.toLowerCase(),
          );
          if (targetList) {
            await client.moveCard(card.id as string, targetList.id as string, boardId);
          } else {
            errors.push(`Target list "${operation.moveToListName}" not found`);
          }
        }

        if (operation.addLabels && operation.addLabels.length > 0) {
          const boardLabels = await client.getBoardLabels(boardId) as Array<Record<string, unknown>>;
          for (const labelName of operation.addLabels) {
            const label = boardLabels.find((l) => (l.name as string).toLowerCase() === labelName.toLowerCase());
            if (label) {
              try {
                await client.addLabelToCard(card.id as string, label.id as string);
              } catch {}
            }
          }
        }

        if (operation.removeLabels && operation.removeLabels.length > 0) {
          const boardLabels = await client.getBoardLabels(boardId) as Array<Record<string, unknown>>;
          for (const labelName of operation.removeLabels) {
            const label = boardLabels.find((l) => (l.name as string).toLowerCase() === labelName.toLowerCase());
            if (label) {
              try {
                await client.removeLabelFromCard(card.id as string, label.id as string);
              } catch {}
            }
          }
        }

        updated++;
      } catch (err) {
        errors.push(`Card "${card.name as string}": ${getErrorMessage(err)}`);
      }
    }
  }

  return { updated, errors };
}
