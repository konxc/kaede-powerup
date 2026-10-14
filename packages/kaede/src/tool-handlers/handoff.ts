/**
 * KAEDE MCP — Agent-to-Agent Handoff Tool Handlers
 */

import {
  createHandoffDirective,
  createStatusUpdateComment,
  parseHandoffDirectives,
  type HandoffStatus,
} from '../agent-handoff';
import { withTrelloClient } from '../mcp-helpers';

export async function handleHandoffTask(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const cardId = args.cardId as string;
  const targetAgent = args.targetAgent as string;
  const action = args.action as string;

  if (!cardId) throw new Error('cardId is required for handoff_task');
  if (!targetAgent) throw new Error('targetAgent is required for handoff_task');
  if (!action) throw new Error('action is required for handoff_task');

  const { comment, directive } = createHandoffDirective({
    sourceAgent: (args.sourceAgent as string) || 'kaede-orchestrator',
    targetAgent,
    cardId,
    cardTitle: args.cardTitle as string | undefined,
    action,
    instructions: args.instructions as string | undefined,
    payload: (args.payload as Record<string, unknown>) || {},
  });

  const shouldExecute = args.execute !== false;
  let posted = false;
  let postError: string | null = null;

  if (shouldExecute) {
    try {
      await withTrelloClient(async (client) => {
        await client.callTool('add_comment_to_card', {
          cardId,
          text: comment,
        });
      });
      posted = true;
    } catch (err) {
      postError = (err as Error).message;
    }
  }

  return {
    success: true,
    directive,
    comment,
    posted,
    postError,
  };
}

export async function handleGetHandoffDirectives(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const cardId = args.cardId as string;
  if (!cardId) throw new Error('cardId is required for get_handoff_directives');

  let comments: Array<{ text?: string; id?: string; date?: string }> = [];

  try {
    const res = await withTrelloClient(async (client) => {
      return (await client.callTool('get_card_comments', { cardId })) as Array<{
        data?: { text?: string };
        text?: string;
        id?: string;
        date?: string;
      }>;
    });
    if (Array.isArray(res)) comments = res;
  } catch (err) {
    return {
      cardId,
      error: `Gagal membaca komentar kartu: ${(err as Error).message}`,
      directives: [],
    };
  }

  const directives = parseHandoffDirectives(comments);

  return {
    cardId,
    totalDirectives: directives.length,
    pendingDirectives: directives.filter((d) => d.status === 'pending'),
    directives,
  };
}

export async function handleUpdateHandoffStatus(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const cardId = args.cardId as string;
  const handoffId = args.handoffId as string;
  const status = args.status as HandoffStatus;

  if (!cardId) throw new Error('cardId is required for update_handoff_status');
  if (!handoffId) throw new Error('handoffId is required for update_handoff_status');
  if (!status) throw new Error('status is required for update_handoff_status');

  const { comment, update } = createStatusUpdateComment(handoffId, status, {
    message: args.message as string | undefined,
    updaterAgent: (args.updaterAgent as string) || 'kaede-agent',
  });

  const shouldExecute = args.execute !== false;
  let posted = false;
  let postError: string | null = null;

  if (shouldExecute) {
    try {
      await withTrelloClient(async (client) => {
        await client.callTool('add_comment_to_card', {
          cardId,
          text: comment,
        });
      });
      posted = true;
    } catch (err) {
      postError = (err as Error).message;
    }
  }

  return {
    success: true,
    update,
    comment,
    posted,
    postError,
  };
}
