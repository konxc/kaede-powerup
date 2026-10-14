import { describe, it, expect } from 'bun:test';
import {
  validateBrandVoice,
  findBrandVoiceFile,
  parseBrandVoiceRules,
} from '../src/brand-voice';

describe('Brand Voice Validation Engine', () => {
  it('should find brand voice file in .openkb/brand/voice-and-tone.md', () => {
    const file = findBrandVoiceFile();
    expect(file).not.toBeNull();
    expect(file).toContain('voice-and-tone.md');
  });

  it('should parse brand voice rules from markdown content', () => {
    const md = `
## 1. Persona Inti
- **Otoritatif, Solutif, Bersahabat**

## 2. Kata Terlarang
- **murah** -> *efisien*
- **gampangan** -> *streamlined*
- **pasti kaya** -> *pertumbuhan terukur*
`;
    const rules = parseBrandVoiceRules(md);
    expect(rules.persona).toContain('Otoritatif');
    expect(rules.forbiddenWords.some((f) => f.word === 'murah')).toBe(true);
    expect(rules.forbiddenWords.some((f) => f.word === 'gampangan')).toBe(true);
  });

  it('should pass validation for clean, compliant copy with CTA and hook', () => {
    const text = `
# Otomasi Alur Kerja AI Agent untuk Tim Digital

Tantangan terbesar agensi digital adalah sinkronisasi tugas antara tim non-teknis dan developer.
Dengan KAEDE, seluruh card Trello dapat terhubung langsung ke agen otomatisasi. Solusi ini efisien,
terukur, dan mudah dioperasikan untuk skala bisnis berkembang.

Pelajari selengkapnya di dokumentasi resmi kami untuk memulai.
`;
    const result = validateBrandVoice(text);
    expect(result.compliant).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.metrics.hasCTA).toBe(true);
    expect(result.metrics.hasHook).toBe(true);
    expect(result.violations.length).toBe(0);
    expect(result.passedChecks.length).toBeGreaterThan(0);
  });

  it('should detect forbidden words and reduce score', () => {
    const text = `
# Jasa SEO Paling Murah dan Cepat Kaya

Kami menawarkan layanan murah meriah yang dijamin 100% bikin Anda langsung profit.
`;
    const result = validateBrandVoice(text);
    expect(result.compliant).toBe(false);
    expect(result.violations.some((v) => v.type === 'forbidden_word')).toBe(true);
    expect(result.metrics.forbiddenWordsCount).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(70);
  });

  it('should warn when CTA is missing', () => {
    const text = `
# Mengenal Model Context Protocol

Model Context Protocol adalah standar terbuka yang dikembangkan untuk menghubungkan AI dengan tools eksternal.
Protokol ini memungkinkan integrasi yang aman dan terstruktur.
`;
    const result = validateBrandVoice(text);
    expect(result.metrics.hasCTA).toBe(false);
    expect(result.violations.some((v) => v.type === 'missing_cta')).toBe(true);
  });

  it('should enforce channel rules for seo-article (H2 check)', () => {
    const textNoH2 = `
# Artikel SEO Tanpa Subheading

Artikel ini membahas strategi konten namun tidak membagi pembahasannya ke dalam sub-heading H2 apa pun.
Pelajari selengkapnya di panduan kami.
`;
    const resNoH2 = validateBrandVoice(textNoH2, { channel: 'seo-article' });
    expect(resNoH2.violations.some((v) => v.message.includes('sub-heading H2'))).toBe(true);

    const textWithH2 = `
# Artikel SEO Lengkap

## Manfaat Otomasi
Penjelasan manfaat automasi di sini.

Pelajari selengkapnya sekarang.
`;
    const resWithH2 = validateBrandVoice(textWithH2, { channel: 'seo-article' });
    expect(resWithH2.violations.some((v) => v.message.includes('sub-heading H2'))).toBe(false);
  });

  it('should detect runaway sentences with > 35 words', () => {
    const runawayText = `
# Analisis Perkembangan Teknologi

Perkembangan teknologi kecerdasan buatan saat ini sedang mengalami akselerasi yang sangat pesat di berbagai belahan dunia terutama karena adanya integrasi model bahasa besar dengan protokol konteks terbuka yang memungkinkan sistem perangkat lunak mandiri beroperasi secara headless dan mengambil keputusan operasional kompleks tanpa perlu campur tangan manual konstan dari tim engineering di setiap langkah kecilnya.

Hubungi kami untuk informasi lebih lanjut.
`;
    const result = validateBrandVoice(runawayText);
    expect(result.violations.some((v) => v.type === 'runaway_sentence')).toBe(true);
  });
});
