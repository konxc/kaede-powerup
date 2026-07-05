/**
 * KAEDE — Card template engine types
 */

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

export type UserTemplateSource = {
  path: string;
  name: string;
};
