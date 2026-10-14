import { describe, it, expect } from 'bun:test';
import {
  createHandoffDirective,
  createStatusUpdateComment,
  parseHandoffDirectives,
  HANDOFF_START_TAG,
  HANDOFF_END_TAG,
  STATUS_START_TAG,
  STATUS_END_TAG,
} from '../src/agent-handoff';

describe('Agent-to-Agent Handoff Event Mechanism', () => {
  it('should format a valid handoff directive comment with machine and human readable sections', () => {
    const { comment, directive } = createHandoffDirective({
      sourceAgent: 'kaede-orchestrator',
      targetAgent: 'agent-hermes',
      cardId: 'card-123',
      action: 'publish_article_draft',
      instructions: 'Publish to WordPress at konxc.space',
      payload: { slug: 'automasi-digital-agency', status: 'draft' },
    });

    expect(directive.protocol).toBe('kaede-handoff/v1');
    expect(directive.targetAgent).toBe('agent-hermes');
    expect(directive.status).toBe('pending');
    expect(directive.payload.slug).toBe('automasi-digital-agency');

    expect(comment).toContain(HANDOFF_START_TAG);
    expect(comment).toContain(HANDOFF_END_TAG);
    expect(comment).toContain('🤖 **KAEDE Agent Handoff Directive**');
    expect(comment).toContain('`@agent-hermes`');
    expect(comment).toContain('publish_article_draft');
  });

  it('should format a status update comment', () => {
    const { comment, update } = createStatusUpdateComment('handoff-999', 'in_progress', {
      message: 'Hermes sedang memproses penerbitan draf...',
      updaterAgent: 'agent-hermes',
    });

    expect(update.protocol).toBe('kaede-handoff/v1');
    expect(update.type).toBe('status_update');
    expect(update.handoffId).toBe('handoff-999');
    expect(update.status).toBe('in_progress');

    expect(comment).toContain(STATUS_START_TAG);
    expect(comment).toContain(STATUS_END_TAG);
    expect(comment).toContain('`in_progress`');
    expect(comment).toContain('`@agent-hermes`');
  });

  it('should parse handoff directives and apply status updates chronologically', () => {
    const handoff1 = createHandoffDirective({
      sourceAgent: 'antigravity-cli',
      targetAgent: 'agent-hermes',
      cardId: 'card-abc',
      action: 'send_whatsapp_alert',
      payload: { phone: '+628123456789' },
    });

    const status1 = createStatusUpdateComment(handoff1.directive.id, 'completed', {
      message: 'Pesan WhatsApp telah terkirim sukses ke Mas Sandiko.',
      updaterAgent: 'agent-hermes',
    });

    const comments = [
      { text: 'Komentar tim biasa', date: '2026-10-14T10:00:00Z' },
      { text: handoff1.comment, date: '2026-10-14T10:05:00Z' },
      { text: status1.comment, date: '2026-10-14T10:06:00Z' },
    ];

    const parsed = parseHandoffDirectives(comments);
    expect(parsed.length).toBe(1);
    expect(parsed[0].id).toBe(handoff1.directive.id);
    expect(parsed[0].targetAgent).toBe('agent-hermes');
    expect(parsed[0].status).toBe('completed');
  });

  it('should handle multiple directives and track each status independently', () => {
    const h1 = createHandoffDirective({
      targetAgent: 'agent-hermes',
      cardId: 'card-1',
      action: 'task_one',
    });
    const h2 = createHandoffDirective({
      targetAgent: 'opencode',
      cardId: 'card-1',
      action: 'task_two',
    });

    const s1 = createStatusUpdateComment(h1.directive.id, 'failed', {
      message: 'Rate limit tercapai',
      updaterAgent: 'agent-hermes',
    });

    const comments = [
      { text: h1.comment },
      { text: h2.comment },
      { text: s1.comment },
    ];

    const parsed = parseHandoffDirectives(comments);
    expect(parsed.length).toBe(2);

    const directive1 = parsed.find((d) => d.id === h1.directive.id);
    const directive2 = parsed.find((d) => d.id === h2.directive.id);

    expect(directive1?.status).toBe('failed');
    expect(directive2?.status).toBe('pending');
  });
});
