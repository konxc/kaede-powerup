/**
 * KAEDE — Shared Type Definitions & Utilities
 *
 * Types dan utilities yang digunakan bersama antar modul.
 * Dipisahkan untuk menghindari circular dependencies.
 */

// ── Error Helper ──

/**
 * Ekstrak pesan error dengan aman dari unknown type.
 * Pattern ini menggantikan `(err as Error).message` yang tidak type-safe.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) return String((err as Record<string, unknown>).message);
  return String(err);
}

// ── Multi-board Orchestration Types ──

/**
 * Satu langkah dalam plan — bisa standalone atau punya ref + dependencies.
 * `ref` dipakai oleh step lain via `dependsOn[]`.
 */
export type PlanStep = {
  action: string;
  params: Record<string, unknown>;
  description: string;
  ref?: string;
  dependsOn?: string[];
};

/**
 * Input batch untuk 1 card yang akan di-create dengan nested resources (checklist, comment, labels).
 */
export type BatchCard = {
  task: string;
  desc?: string;
  list?: string;
  start?: string;
  due?: string;
  checklist?: string[];
  comment?: string;
  labels?: string[];
};

/**
 * Spesifikasi board target. `listMappings` opsional untuk cache listId.
 */
export type BoardSpec = {
  boardId: string;
  boardName: string;
  listMappings?: Record<string, string>;
};

/**
 * Map internal ref → real ID hasil eksekusi.
 */
export type RefMap = Map<string, { id: string; type: string }>;

/**
 * Hasil eksekusi 1 plan step.
 */
export type ExecStepResult = {
  ref?: string;
  action: string;
  success: boolean;
  resultId?: string;
  resultName?: string;
  error?: string;
};

/**
 * Hasil eksekusi seluruh plan (multi-step, multi-board).
 */
export type ExecPlanResult = {
  success: boolean;
  steps: ExecStepResult[];
  refMap: Record<string, string>;
  totalSteps: number;
  succeeded: number;
  failed: number;
};

// ── Playbook & Context Types ──

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

// ── Card & Duplicate Detection Types ──

export type CardItem = {
  id: string;
  name: string;
  listName?: string;
  listId?: string;
  boardId?: string;
  boardName?: string;
  url?: string;
  desc?: string;
};

export type ListData = {
  listId: string;
  listName: string;
  cards: CardItem[];
};

export type BoardSnapshot = {
  boardId: string;
  boardName: string;
  lists: ListData[];
};

export type FindCardResult = {
  exact: CardItem | null;
  similar: CardItem[];
  totalCards: number;
};

export type DuplicateGroup = {
  name: string;
  count: number;
  cards: (CardItem & { listName: string; boardName: string })[];
  location: 'sameList' | 'crossList' | 'crossBoard';
};

export type DetectDuplicatesResult = {
  sameList: DuplicateGroup[];
  crossList: DuplicateGroup[];
  crossBoard: DuplicateGroup[];
  totalDuplicateCards: number;
  totalCards: number;
};

export type ValidationWarning = {
  type: 'duplicate_name' | 'list_not_found' | 'naming_convention' | 'cross_board_conflict' | 'label_exists';
  severity: 'info' | 'warning' | 'blocker';
  message: string;
  existing?: CardItem;
};

export type ValidateContextResult = {
  safe: boolean;
  warnings: ValidationWarning[];
  existingMatches: CardItem[];
  blockers: string[];
};

export type ArchiveAction = {
  action: 'archive_card';
  params: { cardId: string; cardName: string; reason: string };
  description: string;
};

export type ArchiveDuplicatesResult = {
  plan: ArchiveAction[];
  summary: string;
  archivedCards: number;
};

// ── Card Template Engine Types ──

export type CardTemplateDef = {
  name: string;
  descriptionTemplate: string;
  checklistTemplates: string[];
  commentTemplate?: string;
  defaultLabels?: string[];
};

export type BuiltInTemplate = 'feature' | 'bug' | 'task' | 'chore' | 'onboarding' | 'user-story' | 'sprint-planning' | 'sprint-retro' | 'daily-standup';

export type TemplateVars = {
  task: string;
  feature?: string;
  role?: string;
  want?: string;
  benefit?: string;
  techStack?: string;
  assignee?: string;
  reference?: string;
  convention?: string;
  priority?: string;
  sprint?: string;
  [key: string]: string | undefined;
};

export type TemplateResult = {
  description: string;
  checklist: string[];
  comment?: string;
  labels: string[];
};

// ── User-Defined Template Types ──

export type UserTemplateSource = {
  path: string;
  name: string;
};

// ── Execution History / Undo Types ──

export type ExecutedStep = {
  action: string;
  params: Record<string, unknown>;
  ref?: string;
  success: boolean;
  resultId?: string;
  inverseAction?: string;
  inverseParams?: Record<string, unknown>;
};

export type ExecutionHistory = {
  planId: string;
  timestamp: number;
  steps: ExecutedStep[];
  boardIds: string[];
};

// ── Sprint Report Types ──

export type SprintCardData = {
  id: string;
  name: string;
  listName: string;
  due?: string;
  dueComplete?: boolean;
  start?: string;
  labels?: Array<{ id: string; name: string; color: string }>;
  members?: Array<{ id: string; fullName: string }>;
  desc?: string;
  url?: string;
  dateLastActivity?: string;
};

export type SprintReport = {
  boardName: string;
  sprintName: string;
  generatedAt: string;
  totalCards: number;
  lists: Array<{
    listName: string;
    cardCount: number;
    cards: SprintCardData[];
  }>;
  groupedByLabel: Record<string, number>;
  overdueCount: number;
  completedCount: number;
  memberStats: Array<{ fullName: string; cardCount: number }>;
  markdown: string;
};

// ── Batch Card Update Types ──

export type BatchUpdateFilter = {
  listName?: string;
  labelName?: string;
  memberId?: string;
  dueBefore?: string;
  dueAfter?: string;
};

export type BatchUpdateOperation = {
  moveToListName?: string;
  addLabels?: string[];
  removeLabels?: string[];
  setName?: string;
  setDescription?: string;
  setDue?: string;
  setStart?: string;
};

// ── Prompt Builder / Smart Defaults Types ──

export type ResolvedContext = {
  boardId: string;
  boardName: string;
  listName: string;
  listId?: string;
  confidence: 'exact' | 'fuzzy' | 'fallback';
  warnings: string[];
};
