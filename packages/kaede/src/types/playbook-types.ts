/**
 * KAEDE — Playbook & context types
 */

export interface PlaybookConventions {
  titlePrefixes: string[];
  descriptionTemplate: string;
  labels: Array<{ color: string; meaning: string }>;
}

export interface PlaybookResult {
  title: string;
  roles: Array<{
    name: string;
    responsibilities: string[];
    access: string;
    aiInstructions: string;
  }>;
  workflow: { lists: string[] };
  conventions: PlaybookConventions;
}

export interface IntentResult {
  success: boolean;
  type: string;
  name: string;
  error?: string;
  result?: unknown;
  detail?: unknown;
}

export interface BundlePaths {
  playbook?: string;
  openkb?: string;
  opencode?: string;
}

export interface BundleContextResult {
  playbook: PlaybookResult | null;
  openkb: { glossary: string[]; decisions: string[] };
  opencode: Record<string, unknown> | null;
}
