import { withTrelloClient } from '../mcp-helpers';

export async function handleListBoards(_args: Record<string, unknown>): Promise<Record<string, unknown>> {
  return withTrelloClient(async (client) => {
    const boards = await client.callTool('list_boards', {});
    return { boards };
  });
}

export async function handleListWorkspaces(_args: Record<string, unknown>): Promise<Record<string, unknown>> {
  return withTrelloClient(async (client) => {
    const workspaces = await client.callTool('list_workspaces', {});
    return { workspaces };
  });
}

export async function handleGetLists(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const boardId = args.boardId as string;
  if (!boardId) throw new Error('boardId is required');

  return withTrelloClient(async (client) => {
    const lists = await client.callTool('get_lists', { boardId });
    return { lists };
  });
}

export async function handleGetCardsByListId(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const listId = args.listId as string;
  if (!listId) throw new Error('listId is required');

  return withTrelloClient(async (client) => {
    const result = await client.callTool('get_cards_by_list_id', { listId, boardId: args.boardId });
    return { cards: (result as Record<string, unknown>).cards || [] };
  });
}

export async function handleGetCard(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const cardId = args.cardId as string;
  if (!cardId) throw new Error('cardId is required');

  return withTrelloClient(async (client) => {
    const card = await client.callTool('get_card', { cardId, includeMarkdown: args.includeMarkdown ?? false });
    return { card };
  });
}

export async function handleGetBoardMembers(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const boardId = args.boardId as string;
  if (!boardId) throw new Error('boardId is required');

  return withTrelloClient(async (client) => {
    const members = await client.callTool('get_board_members', { boardId });
    return { members };
  });
}

export async function handleGetBoardLabels(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const boardId = args.boardId as string;
  if (!boardId) throw new Error('boardId is required');

  return withTrelloClient(async (client) => {
    const labels = await client.callTool('get_board_labels', { boardId });
    return { labels };
  });
}

export async function handleSearchBoards(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const query = args.query as string;
  if (!query) throw new Error('query is required');

  return withTrelloClient(async (client) => {
    const boards = await client.callTool('search_boards', { query });
    return { boards };
  });
}

export async function handleSearchCards(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const query = args.query as string;
  if (!query) throw new Error('query is required');

  return withTrelloClient(async (client) => {
    const boards = await client.callTool('search_cards', { query });
    return { cards: (boards as Record<string, unknown>).cards || [] };
  });
}

export async function handleGetMyCards(_args: Record<string, unknown>): Promise<Record<string, unknown>> {
  return withTrelloClient(async (client) => {
    const result = await client.callTool('get_my_cards', {});
    return { cards: (result as Record<string, unknown>).cards || [] };
  });
}
