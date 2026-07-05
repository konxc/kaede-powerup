export interface IListClient {
  getLists(boardId: string): Promise<unknown[]>;
  createList(boardId: string, name: string): Promise<unknown>;
  archiveList(listId: string): Promise<unknown>;
  updateList(options: { listId: string; name?: string; closed?: boolean; pos?: number; subscribed?: boolean }): Promise<unknown>;
  sortListCards(listId: string, sort: string): Promise<unknown>;
}
