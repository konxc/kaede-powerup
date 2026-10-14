import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTemplate, listTemplates, applyTemplate, generateCardFromTemplate } from '../src/templates.ts';

describe('Card Template Engine', () => {
  describe('getTemplate', () => {
    it('returns feature template', () => {
      const t = getTemplate('feature');
      assert.ok(t);
      assert.equal(t.name, 'feature');
      assert.ok(t.descriptionTemplate.includes('{{task}}'));
      assert.ok(t.checklistTemplates.length > 0);
      assert.ok(t.commentTemplate);
    });

    it('returns bug template', () => {
      const t = getTemplate('bug');
      assert.ok(t);
      assert.equal(t.name, 'bug');
      assert.ok(t.descriptionTemplate.includes('Severity'));
    });

    it('returns task template', () => {
      const t = getTemplate('task');
      assert.ok(t);
      assert.equal(t.name, 'task');
      assert.ok(t.descriptionTemplate.includes('{{task}}'));
    });

    it('returns chore template', () => {
      const t = getTemplate('chore');
      assert.ok(t);
      assert.equal(t.name, 'chore');
      assert.strictEqual(t.commentTemplate, null);
    });

    it('returns onboarding template', () => {
      const t = getTemplate('onboarding');
      assert.ok(t);
      assert.equal(t.name, 'onboarding');
      assert.ok(t.descriptionTemplate.includes('Welcome'));
    });

    it('returns null for unknown template', () => {
      assert.strictEqual(getTemplate('nonexistent'), null);
    });
  });

  describe('listTemplates', () => {
    it('returns all 13 built-in templates (dev + digital agency)', () => {
      const all = listTemplates();
      assert.equal(all.length, 13);
      const names = all.map((t) => t.name);
      assert.ok(names.includes('feature'));
      assert.ok(names.includes('bug'));
      assert.ok(names.includes('task'));
      assert.ok(names.includes('chore'));
      assert.ok(names.includes('onboarding'));
      assert.ok(names.includes('seo-article'));
      assert.ok(names.includes('social-media-post'));
      assert.ok(names.includes('lead-funnel'));
      assert.ok(names.includes('web-copy'));
    });
  });

  describe('applyTemplate', () => {
    it('generates feature card with defaults', () => {
      const r = applyTemplate('feature', {
        task: 'Login Page',
        role: 'teacher',
        want: 'login with email',
        benefit: 'access the system',
      });
      assert.ok(r.description.includes('Login Page'));
      assert.ok(r.description.includes('teacher'));
      assert.ok(r.description.includes('login with email'));
      assert.ok(r.description.includes('access the system'));
      assert.ok(r.checklist.length >= 5);
      assert.ok(r.comment);
      assert.ok(r.comment.includes('Login Page'));
      assert.deepEqual(r.labels, ['enhancement']);
    });

    it('generates bug card', () => {
      const r = applyTemplate('bug', {
        task: '500 Error on Login',
        priority: 'Critical',
      });
      assert.ok(r.description.includes('500 Error on Login'));
      assert.ok(r.description.includes('Critical'));
      assert.ok(r.checklist.length >= 3);
      assert.ok(r.comment);
      assert.deepEqual(r.labels, ['bug']);
    });

    it('generates task card', () => {
      const r = applyTemplate('task', {
        task: 'Create API Endpoint',
        want: 'Build REST API for attendance',
      });
      assert.ok(r.description.includes('Create API Endpoint'));
      assert.ok(r.description.includes('Build REST API for attendance'));
      assert.ok(r.checklist.length >= 3);
    });

    it('generates chore card without comment', () => {
      const r = applyTemplate('chore', {
        task: 'Update Dependencies',
        want: 'Bump Laravel to 13.x',
      });
      assert.ok(r.description.includes('Update Dependencies'));
      assert.equal(r.comment, undefined);
    });

    it('generates onboarding card', () => {
      const r = applyTemplate('onboarding', {
        task: 'Fathan',
        feature: 'SMART Absen',
        convention: 'PSR-12',
      });
      assert.ok(r.description.includes('Fathan'));
      assert.ok(r.description.includes('SMART Absen'));
      assert.ok(r.checklist.includes('Read master-plan.md (high level overview)'));
      assert.ok(r.comment);
      assert.ok(r.comment.includes('Fathan'));
    });

    it('handles template with custom variables', () => {
      const r = applyTemplate('feature', {
        task: 'Attendance Module',
        role: 'student',
        want: 'submit attendance with selfie',
        benefit: 'record my presence',
        techStack: 'React + Laravel',
        reference: 'Figma design v2',
      });
      assert.ok(r.description.includes('React + Laravel'));
      assert.ok(r.description.includes('Figma design v2'));
    });

    it('falls back to raw template string when vars missing', () => {
      const r = applyTemplate('feature', { task: 'Test Card' });
      assert.ok(r.description.includes('Test Card'));
      // {{placeholders}} that weren't filled remain (no crash)
      assert.ok(r.description.length > 20);
    });

    it('returns fallback for invalid template source', () => {
      const r = applyTemplate('nonexistent', { task: 'Hello' });
      assert.equal(r.description, 'Hello');
      assert.equal(r.checklist.length, 0);
      assert.equal(r.comment, undefined);
      assert.equal(r.labels.length, 0);
    });

    it('generates seo-article card with keywords and checklist', () => {
      const r = applyTemplate('seo-article', {
        task: 'Panduan Integrasi AI',
        keyword: 'integrasi ai agent',
        role: 'Tech Lead & Developer',
        want: 'Kenapa integrasi AI agent di Trello penting',
        benefit: 'Meningkatkan produktivitas tim hingga 3x lipat',
        ctaLink: 'https://koneksi.co.id/demo',
      });
      assert.ok(r.description.includes('SEO Article: Panduan Integrasi AI'));
      assert.ok(r.description.includes('integrasi ai agent'));
      assert.ok(r.checklist.length >= 6);
      assert.ok(r.comment);
      assert.deepEqual(r.labels, ['seo', 'content']);
    });

    it('generates social-media-post card', () => {
      const r = applyTemplate('social-media-post', {
        task: 'Tips Prompting Anti-Halusinasi',
        platform: 'Instagram',
        want: 'Stop prompting panjang lebar tanpa konteks!',
        benefit: 'Gunakan hierarki 4-layer context di OpenKB.',
        ctaLink: 'https://koneksi.co.id/linkinbio',
      });
      assert.ok(r.description.includes('Social Media: Tips Prompting Anti-Halusinasi'));
      assert.ok(r.description.includes('Instagram'));
      assert.ok(r.checklist.length >= 5);
      assert.deepEqual(r.labels, ['social-media', 'creative']);
    });

    it('generates lead-funnel card', () => {
      const r = applyTemplate('lead-funnel', {
        task: 'Webinar Agentic AI untuk Agensi',
        funnelStage: 'MOFU',
        offer: 'Ebook Gratis + Akses Rekaman',
        want: 'Agensi digital kewalahan mengelola ratusan aset',
        benefit: 'Otomasi alur kerja agensi dengan KAEDE MCP',
        ctaLink: 'https://wa.me/6289649246450',
      });
      assert.ok(r.description.includes('Lead Funnel: Webinar Agentic AI'));
      assert.ok(r.description.includes('MOFU'));
      assert.ok(r.checklist.length >= 5);
      assert.deepEqual(r.labels, ['marketing', 'funnel']);
    });

    it('generates web-copy card', () => {
      const r = applyTemplate('web-copy', {
        task: 'Landing Page KAEDE Power-Up',
        feature: 'Hero & Value Proposition',
        want: 'Konversi pengunjung menjadi pengguna aktif',
        benefit: 'Zero config Trello power-up untuk AI agent',
        ctaLink: 'https://kaede-powerup.netlify.app',
      });
      assert.ok(r.description.includes('Web Copy: Landing Page KAEDE Power-Up'));
      assert.ok(r.checklist.length >= 5);
      assert.deepEqual(r.labels, ['copywriting', 'web']);
    });
  });

  describe('generateCardFromTemplate', () => {
    it('is alias for applyTemplate with template name', () => {
      const r1 = generateCardFromTemplate('feature', { task: 'X', role: 'admin', want: 'Y', benefit: 'Z' });
      const r2 = applyTemplate('feature', { task: 'X', role: 'admin', want: 'Y', benefit: 'Z' });
      assert.deepEqual(r1, r2);
    });

    it('generates complete card content', () => {
      const r = generateCardFromTemplate('feature', {
        task: 'Dashboard',
        role: 'admin',
        want: 'view attendance stats',
        benefit: 'monitor student presence',
      });
      assert.ok(r.description);
      assert.ok(r.checklist.length > 0);
      assert.ok(r.comment);
      assert.ok(r.labels.length > 0);
    });
  });
});
