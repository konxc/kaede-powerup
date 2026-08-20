/**
 * KAEDE — Plan execution types: steps, batch cards, board specs, execution history
 */

// ── Multi-board Orchestration Types ──

export type PlanStep = {
  action: string;
  params: Record<string, unknown>;
  description: string;
  ref?: string;
  dependsOn?: string[];
};

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

export type BoardSpec = {
  boardId: string;
  boardName: string;
  listMappings?: Record<string, string>;
};

export type RefMap = Map<string, { id: string; type: string }>;

export type ExecStepResult = {
  ref?: string;
  action: string;
  success: boolean;
  resultId?: string;
  resultName?: string;
  error?: string;
};

export type ExecPlanResult = {
  success: boolean;
  steps: ExecStepResult[];
  refMap: Record<string, string>;
  totalSteps: number;
  succeeded: number;
  failed: number;
};

// ── Execution History / Undo Types ──

export type ExecutedStep = {
  action: string;
  params: Record<string, unknown>;
  ref?: string;
  success: boolean;
  resultId?: string;
  error?: string;
  inverseAction?: string;
  inverseParams?: Record<string, unknown>;
};

export type ExecutionHistory = {
  planId: string;
  timestamp: number;
  steps: ExecutedStep[];
  boardIds: string[];
};
