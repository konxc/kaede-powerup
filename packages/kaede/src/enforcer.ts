/**
 * KAEDE Playbook Enforcer — Structured enforcement output
 *
 * Validates Trello actions against playbook conventions:
 * - Title prefix compliance (feat:, fix:, docs:, ds:)
 * - Allowed labels from playbook conventions
 * - Workflow list compliance
 * - Role-based access validation
 */

import type { PlaybookResult, EnforcementWarning, EnforceResult, BoardSnapshot, PlanStep } from './types';

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function getPrefix(cardName: string): string | null {
  const match = cardName.match(/^(\w[\w-]*?:)/);
  return match ? match[1].toLowerCase() : null;
}

export function validateCardPrefix(
  cardName: string,
  allowedPrefixes: string[],
): EnforcementWarning | null {
  if (!cardName || !allowedPrefixes || allowedPrefixes.length === 0) return null;

  const prefix = getPrefix(cardName);
  if (!prefix) {
    return {
      rule: 'title_prefix',
      severity: 'warning',
      message: `Card title "${cardName}" has no prefix. Expected one of: ${allowedPrefixes.join(', ')}`,
      actual: '(none)',
      expected: allowedPrefixes.join(', '),
    };
  }

  const allowed = allowedPrefixes.map(normalize);
  if (!allowed.includes(prefix)) {
    return {
      rule: 'title_prefix',
      severity: 'warning',
      message: `Card title "${cardName}" uses prefix "${prefix}" which is not in allowed prefixes: ${allowedPrefixes.join(', ')}`,
      actual: prefix,
      expected: allowedPrefixes.join(', '),
    };
  }

  return null;
}

export function validateCardLabel(
  labelName: string,
  allowedLabels: Array<{ color: string; meaning: string }>,
): EnforcementWarning | null {
  if (!labelName || !allowedLabels || allowedLabels.length === 0) return null;

  const lower = normalize(labelName);
  const matched = allowedLabels.some((l) => normalize(l.color) === lower || normalize(l.meaning).includes(lower));

  if (!matched) {
    return {
      rule: 'allowed_label',
      severity: 'warning',
      message: `Label "${labelName}" is not defined in playbook conventions. Allowed: ${allowedLabels.map((l) => l.color).join(', ')}`,
      actual: labelName,
      expected: allowedLabels.map((l) => `${l.color} (${l.meaning})`).join(', '),
    };
  }

  return null;
}

export function validateWorkflowList(
  listName: string,
  workflowLists: string[],
): EnforcementWarning | null {
  if (!listName || !workflowLists || workflowLists.length === 0) return null;

  const lower = normalize(listName);
  const matched = workflowLists.some((l) => normalize(l) === lower);

  if (!matched) {
    return {
      rule: 'workflow_list',
      severity: 'info',
      message: `List "${listName}" is not in workflow lists: ${workflowLists.join(', ')}`,
      actual: listName,
      expected: workflowLists.join(', '),
    };
  }

  return null;
}

export function validateRoleAccess(
  roleName: string,
  action: string,
  roles: PlaybookResult['roles'],
): EnforcementWarning | null {
  if (!roleName || !roles || roles.length === 0) return null;

  const restrictedActions: Record<string, string[]> = {
    close_sprint: ['PM', 'Lead', 'Admin'],
    setup_sprint: ['PM', 'Lead'],
    batch_update_cards: ['PM', 'Lead'],
    delete_board: ['Admin'],
    archive_board: ['Admin'],
  };

  const requiredRoles = restrictedActions[action];
  if (!requiredRoles) return null;

  const matched = roles.find((r) => normalize(r.name) === normalize(roleName));
  if (!matched || !requiredRoles.some((rr) => normalize(rr) === normalize(roleName))) {
    return {
      rule: 'role_access',
      severity: 'blocker',
      message: `Role "${roleName}" does not have permission to execute "${action}". Required: ${requiredRoles.join(', ')}`,
      actual: roleName,
      expected: requiredRoles.join(', '),
    };
  }

  return null;
}

export function enforcePlaybook(
  plan: PlanStep[],
  playbook: PlaybookResult,
  boards?: BoardSnapshot[],
): EnforceResult {
  const warnings: EnforcementWarning[] = [];
  const { titlePrefixes, labels: allowedLabels } = playbook.conventions;
  const { lists: workflowLists } = playbook.workflow;

  for (const step of plan) {
    if (step.action === 'create_card') {
      const cardName = (step.params?.name as string) || '';
      const cardLabels = (step.params?.labels as string[]) || [];

      const prefixWarn = validateCardPrefix(cardName, titlePrefixes);
      if (prefixWarn) warnings.push(prefixWarn);

      const listName = (step.params?.listName as string) || '';
      const listWarn = validateWorkflowList(listName, workflowLists);
      if (listWarn) warnings.push(listWarn);

      for (const lbl of cardLabels) {
        const labelWarn = validateCardLabel(lbl, allowedLabels);
        if (labelWarn) warnings.push(labelWarn);
      }
    }

    if (step.action === 'create_list') {
      const listName = (step.params?.name as string) || '';
      if (listName && workflowLists.length > 0) {
        const wfWarn = validateWorkflowList(listName, workflowLists);
        if (wfWarn) warnings.push(wfWarn);
      }
    }

    if (step.action === 'close_sprint' || step.action === 'batch_update_cards') {
      const roleWarn = validateRoleAccess('PM', step.action, playbook.roles);
      if (roleWarn && boards) {
        warnings.push(roleWarn);
      }
    }
  }

  if (boards) {
    for (const board of boards) {
      for (const list of board.lists) {
        for (const card of list.cards) {
          const prefixWarn = validateCardPrefix(card.name, titlePrefixes);
          if (prefixWarn) warnings.push(prefixWarn);
        }
      }
    }
  }

  const blockers = warnings.filter((w) => w.severity === 'blocker').map((w) => w.message);
  const safe = blockers.length === 0;

  let summary: string;
  if (warnings.length === 0) {
    summary = 'All actions comply with playbook conventions.';
  } else {
    const blocking = blockers.length;
    const advisory = warnings.length - blocking;
    summary = `${warnings.length} playbook violation(s) found: ${blocking} blocker(s), ${advisory} advisory.`;
  }

  return { safe, warnings, blockers, summary };
}

export function enforceSingleAction(
  action: string,
  params: Record<string, unknown>,
  playbook: PlaybookResult,
): EnforceResult {
  const plan: PlanStep[] = [{ action, params, description: '' }];
  return enforcePlaybook(plan, playbook);
}
