/**
 * KAEDE — Trello-related types: cards, lists, boards, duplicates, validation, reports
 */

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

export type EnforcementWarning = {
  rule: 'title_prefix' | 'allowed_label' | 'workflow_list' | 'role_access';
  severity: 'info' | 'warning' | 'blocker';
  message: string;
  actual?: string;
  expected?: string;
};

export type EnforceResult = {
  safe: boolean;
  warnings: EnforcementWarning[];
  blockers: string[];
  summary: string;
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
