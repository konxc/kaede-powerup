export interface IBoardClient {
  listBoards(): Promise<unknown[]>;
  listWorkspaces(): Promise<unknown[]>;
  createBoard(name: string, opts?: Record<string, unknown>): Promise<unknown>;
}
