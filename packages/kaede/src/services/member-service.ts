/**
 * Member Service — Trello member operations
 */

import type { IMemberClient } from '../interfaces/imember-client';

export class MemberService implements IMemberClient {
  constructor(private callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>) {}

  async getBoardMembers(boardId: string): Promise<unknown[]> {
    const r = (await this.callTool('get_board_members', { boardId })) as { members?: unknown[] };
    return r.members || [];
  }

  async assignMember(cardId: string, memberId: string): Promise<unknown> {
    return this.callTool('assign_member_to_card', { cardId, memberId });
  }

  async removeMember(cardId: string, memberId: string): Promise<unknown> {
    return this.callTool('remove_member_from_card', { cardId, memberId });
  }
}
