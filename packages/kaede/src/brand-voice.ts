/**
 * KAEDE — Brand Voice & Copy Validation Engine
 *
 * Memvalidasi kesesuaian konten teks (artikel SEO, copywriting, materi sosmed)
 * terhadap pedoman brand voice di .openkb/brand/voice-and-tone.md atau aturan default.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export interface BrandVoiceViolation {
  type: 'forbidden_word' | 'missing_cta' | 'missing_hook' | 'runaway_sentence' | 'tone_mismatch' | 'channel_rule';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  snippet?: string;
  suggestion?: string;
}

export interface BrandVoiceOptions {
  openkbPath?: string;
  brandVoicePath?: string;
  persona?: string;
  channel?: 'seo-article' | 'social-media-post' | 'lead-funnel' | 'web-copy' | 'general';
  customForbiddenWords?: string[];
  minWords?: number;
  maxWords?: number;
}

export interface BrandVoiceValidationResult {
  compliant: boolean;
  score: number; // 0 to 100
  persona: string;
  channel: string;
  violations: BrandVoiceViolation[];
  passedChecks: string[];
  metrics: {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    readingTimeMinutes: number;
    forbiddenWordsCount: number;
    hasCTA: boolean;
    hasHook: boolean;
  };
  summary: string;
}

const DEFAULT_FORBIDDEN_WORDS: Array<{ word: string; suggestion: string }> = [
  { word: 'paling murah', suggestion: 'efisien atau bernilai investasi tinggi' },
  { word: 'murah', suggestion: 'terjangkau, efisien, atau bernilai ekonomis terukur' },
  { word: 'gampangan', suggestion: 'praktis, streamlined, atau mudah dioperasikan' },
  { word: 'asal jadi', suggestion: 'prototipe awal atau iterasi cepat terukur' },
  { word: 'cepat kaya', suggestion: 'pertumbuhan terukur berbasis eksekusi' },
  { word: 'pasti kaya', suggestion: 'peluang peningkatan performa bisnis' },
  { word: '100% instan', suggestion: 'proses terotomasi cepat' },
  { word: 'dijamin 100%', suggestion: 'didukung jaminan SLA dan garansi tertulis' },
  { word: 'terbaik di dunia', suggestion: 'terbukti unggul berdasarkan data benchmarking' },
  { word: 'nomor satu tanpa tandingan', suggestion: 'pilihan terpercaya ribuan pengguna' },
  { word: 'kepo', suggestion: 'ingin mengetahui lebih dalam' },
  { word: 'alay', suggestion: 'ekspresif atau kasual' },
];

const CTA_PATTERNS = [
  /\b(hubungi|hubungi kami|contact us)\b/i,
  /\b(daftar|daftar sekarang|sign up|register)\b/i,
  /\b(pelajari|pelajari selengkapnya|learn more)\b/i,
  /\b(konsultasi|konsultasi gratis|konsultasikan|consultation)\b/i,
  /\b(klik link|klik di sini|click here)\b/i,
  /\b(dapatkan|dapatkan penawaran|get started)\b/i,
  /\b(jadwalkan|jadwalkan demo|schedule demo)\b/i,
  /\b(unduh|download|checkout|pesan sekarang)\b/i,
  /\b(coba sekarang|try now|free trial)\b/i,
];

/**
 * Mencari file voice-and-tone.md dari path openkb yang diberikan atau direktori standar.
 */
export function findBrandVoiceFile(explicitPath?: string, openkbPath?: string): string | null {
  if (explicitPath && existsSync(explicitPath)) return explicitPath;

  const candidatePaths = [
    openkbPath ? resolve(openkbPath, 'brand', 'voice-and-tone.md') : null,
    openkbPath ? resolve(openkbPath, 'voice-and-tone.md') : null,
    resolve(process.cwd(), '.openkb', 'brand', 'voice-and-tone.md'),
    resolve(process.cwd(), '.openkb', 'voice-and-tone.md'),
  ].filter(Boolean) as string[];

  for (const p of candidatePaths) {
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Mengekstrak daftar kata terlarang dari file voice-and-tone markdown.
 */
export function parseBrandVoiceRules(content: string): {
  persona: string;
  forbiddenWords: Array<{ word: string; suggestion: string }>;
} {
  const forbiddenWords: Array<{ word: string; suggestion: string }> = [...DEFAULT_FORBIDDEN_WORDS];
  let persona = 'Otoritatif, Solutif, Bersahabat';

  const personaMatch = content.match(/##\s+1\.\s+Persona\s+Inti[\s\S]*?(?=##|$)/i);
  if (personaMatch) {
    const lines = personaMatch[0].split('\n').filter((l) => l.includes('**'));
    if (lines.length > 0) {
      persona = lines
        .map((l) => {
          const m = l.match(/\*\*(.+?)\*\*/);
          return m ? m[1] : '';
        })
        .filter(Boolean)
        .join(', ');
    }
  }

  // Parse forbidden words from markdown
  const forbiddenSectionMatch = content.match(/##.*?(?:terlarang|forbidden)[\s\S]*?(?=##|$)/i);
  if (forbiddenSectionMatch) {
    const lines = forbiddenSectionMatch[0].split('\n');
    for (const line of lines) {
      const match = line.match(/[-*]\s+\*\*(.+?)\*\*(?:\s*\/\s*\*\*(.+?)\*\*)?\s*(?:→|->|ganti dengan:)\s*\*(.+?)\*/i);
      if (match) {
        const w1 = match[1].trim();
        const w2 = match[2]?.trim();
        const suggestion = match[3].trim();
        if (w1) forbiddenWords.push({ word: w1, suggestion });
        if (w2) forbiddenWords.push({ word: w2, suggestion });
      }
    }
  }

  return { persona, forbiddenWords };
}

/**
 * Validasi teks terhadap panduan brand voice.
 */
export function validateBrandVoice(
  text: string,
  options: BrandVoiceOptions = {},
): BrandVoiceValidationResult {
  const content = text || '';
  const channel = options.channel || 'general';
  const violations: BrandVoiceViolation[] = [];
  const passedChecks: string[] = [];

  // 1. Muat aturan
  const voiceFile = findBrandVoiceFile(options.brandVoicePath, options.openkbPath);
  let activeRules = {
    persona: options.persona || 'Otoritatif, Solutif, Bersahabat',
    forbiddenWords: [...DEFAULT_FORBIDDEN_WORDS],
  };

  if (voiceFile) {
    try {
      const raw = readFileSync(voiceFile, 'utf-8');
      const parsed = parseBrandVoiceRules(raw);
      if (!options.persona && parsed.persona) activeRules.persona = parsed.persona;
      activeRules.forbiddenWords = parsed.forbiddenWords;
    } catch {
      // fallback ke defaults
    }
  }

  if (options.customForbiddenWords && options.customForbiddenWords.length > 0) {
    for (const cw of options.customForbiddenWords) {
      activeRules.forbiddenWords.push({ word: cw, suggestion: 'hindari penggunaan istilah ini' });
    }
  }

  // 2. Metrik Dasar
  const words = content.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const characterCount = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Pisahkan kalimat secara heuristik
  const rawSentences = content
    .replace(/```[\s\S]*?```/g, '') // hilangkan code blocks
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sentenceCount = rawSentences.length;

  // 3. Cek Kata Terlarang (Forbidden Words)
  const lowerContent = content.toLowerCase();
  const detectedForbidden = new Set<string>();

  for (const item of activeRules.forbiddenWords) {
    const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9_-])${escaped}([^a-zA-Z0-9_-]|$)`, 'i');
    if (regex.test(lowerContent)) {
      if (!detectedForbidden.has(item.word.toLowerCase())) {
        detectedForbidden.add(item.word.toLowerCase());

        // Cari snippet kalimat
        const offendingSentence = rawSentences.find((s) => new RegExp(escaped, 'i').test(s)) || item.word;
        violations.push({
          type: 'forbidden_word',
          severity: 'error',
          message: `Ditemukan kata/frasa terlarang: "${item.word}"`,
          snippet: offendingSentence.slice(0, 120),
          suggestion: `Ganti dengan: ${item.suggestion}`,
        });
      }
    }
  }

  if (detectedForbidden.size === 0) {
    passedChecks.push('Bebas dari kata/frasa terlarang');
  }

  // 4. Cek Call-to-Action (CTA)
  const hasCTA = CTA_PATTERNS.some((p) => p.test(content));
  if (hasCTA) {
    passedChecks.push('Memiliki Call-to-Action (CTA) yang jelas');
  } else {
    violations.push({
      type: 'missing_cta',
      severity: 'warning',
      message: 'Tidak ditemukan Call-to-Action (CTA) yang terdeteksi',
      suggestion: 'Tambahkan ajakan bertindak spesifik (contoh: "Pelajari selengkapnya", "Daftar sekarang", "Konsultasikan kebutuhan Anda").',
    });
  }

  // 5. Cek Hook / Heading
  const hasHook = /(^|\n)#{1,3}\s+.+/m.test(content) || /^[A-Z0-9].{5,80}:/m.test(content);
  if (hasHook) {
    passedChecks.push('Memiliki Hook / Struktur Heading yang memadai');
  } else {
    violations.push({
      type: 'missing_hook',
      severity: 'warning',
      message: 'Konten tidak memiliki Heading (# / ##) atau Hook pembuka yang kuat',
      suggestion: 'Awali konten dengan Headline atau Hook yang menarik perhatian target pembaca.',
    });
  }

  // 6. Cek Runaway Sentences (> 35 kata per kalimat)
  const runawaySentences = rawSentences.filter((s) => s.split(/\s+/).length > 35);
  if (runawaySentences.length === 0) {
    passedChecks.push('Panjang kalimat terukur (tidak ada runaway sentence > 35 kata)');
  } else {
    violations.push({
      type: 'runaway_sentence',
      severity: 'suggestion',
      message: `Ditemukan ${runawaySentences.length} kalimat yang terlalu panjang (> 35 kata)`,
      snippet: runawaySentences[0].slice(0, 100) + '...',
      suggestion: 'Pecah kalimat panjang menjadi 2 kalimat pendek agar lebih mudah dicerna audiens.',
    });
  }

  // 7. Aturan Spesifik Kanal
  if (channel === 'seo-article') {
    const hasH2 = /(^|\n)##\s+.+/m.test(content);
    if (!hasH2) {
      violations.push({
        type: 'channel_rule',
        severity: 'warning',
        message: 'Artikel SEO wajib memiliki minimal satu sub-heading H2 (##)',
        suggestion: 'Tambahkan struktur H2 untuk memecah sub-topik pembahasan.',
      });
    } else {
      passedChecks.push('Artikel SEO memiliki struktur H2');
    }

    if (options.minWords && wordCount < options.minWords) {
      violations.push({
        type: 'channel_rule',
        severity: 'warning',
        message: `Jumlah kata (${wordCount}) di bawah target minimum (${options.minWords} kata)`,
        suggestion: 'Perdalam pembahasan dengan studi kasus atau FAQ tambahan.',
      });
    }
  } else if (channel === 'social-media-post') {
    if (wordCount > 600) {
      violations.push({
        type: 'channel_rule',
        severity: 'warning',
        message: `Panjang post sosial media (${wordCount} kata) berpotensi terlalu panjang untuk engagement optimal`,
        suggestion: 'Pertimbangkan meringkas menjadi format carousel slide atau thread.',
      });
    }
  }

  // 8. Hitung Skor Kepatuhan
  let score = 100;
  for (const v of violations) {
    if (v.severity === 'error') score -= 20;
    else if (v.severity === 'warning') score -= 10;
    else if (v.severity === 'suggestion') score -= 5;
  }
  score = Math.max(0, Math.min(100, score));
  const compliant = score >= 75;

  const summary = compliant
    ? `✓ Lolos validasi brand voice (Skor: ${score}/100). Persona: "${activeRules.persona}". ${violations.length > 0 ? `Catatan: ${violations.length} saran perbaikan kecil.` : 'Semua kriteria terpenuhi sempurna.'}`
    : `✗ Perlu revisi brand voice (Skor: ${score}/100). Ditemukan ${violations.filter((v) => v.severity === 'error').length} pelanggaran kritis dan ${violations.filter((v) => v.severity === 'warning').length} peringatan.`;

  return {
    compliant,
    score,
    persona: activeRules.persona,
    channel,
    violations,
    passedChecks,
    metrics: {
      wordCount,
      characterCount,
      sentenceCount,
      readingTimeMinutes,
      forbiddenWordsCount: detectedForbidden.size,
      hasCTA,
      hasHook,
    },
    summary,
  };
}
