export interface IMemberClient {
  getBoardMembers(boardId: string): Promise<unknown[]>;
  assignMember(cardId: string, memberId: string): Promise<unknown>;
  removeMember(cardId: string, memberId: string): Promise<unknown>;
}
