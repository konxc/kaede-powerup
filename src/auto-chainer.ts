/**
 * KAEDE Auto-Chainer — Compound intent splitting, ref injection, plan chaining
 *
 * Memungkinkan generatePlan menangani intent majemuk seperti
 * "buat card fitur login lalu assign ke Alice" dalam satu panggilan.
 */

import type { PlanStep } from './types';

const CONJUNCTIONS = [
  ' lalu ', ' dan ', ' kemudian ', ' terus ', ' setelah itu ',
  ' then ', ' and then ', ' after that ',
  ' , ',
  '; kemudian ', '; lalu ', '; dan ', '; terus ',
];

export function splitCompoundGoal(goal: string): string[] {
  const trimmed = goal.trim();
  if (!trimmed) return [];

  const parts: string[] = [trimmed];

  for (const conj of CONJUNCTIONS) {
    if (parts.length > 1) break;
    if (trimmed.includes(conj)) {
      const split = trimmed.split(conj).map((s) => s.trim()).filter(Boolean);
      if (split.length > 1) {
        parts.length = 0;
        parts.push(...split);
        break;
      }
    }
  }

  return parts;
}

function extractRefs(goal: string): string[] {
  const words = goal.toLowerCase().split(/\s+/);
  const refs: string[] = [];
  let cardIndex = 0;
  let listIndex = 0;
  let labelIndex = 0;

  if (words.some((w) => ['buat', 'create', 'tambah', 'new'].includes(w)) &&
      words.some((w) => ['card', 'kartu', 'task'].includes(w))) {
    refs.push(`card:${cardIndex++}`);
  }
  if (words.some((w) => ['buat', 'create', 'tambah', 'new'].includes(w)) &&
      words.some((w) => ['list', 'kolom'].includes(w))) {
    refs.push(`list:${listIndex++}`);
  }
  if (words.some((w) => ['buat', 'create', 'tambah'].includes(w)) &&
      words.some((w) => ['label'].includes(w))) {
    refs.push(`label:${labelIndex++}`);
  }

  return refs;
}

export function injectAutoRefs(plan: PlanStep[]): PlanStep[] {
  const refCounters: Record<string, number> = {};
  return plan.map((step) => {
    if (step.ref) return step;

    const action = step.action;
    const prefix = action.replace(/^create_/, '').replace(/^add_/, '');
    if (!refCounters[prefix]) refCounters[prefix] = 0;

    const autoRef = `${prefix}:${refCounters[prefix]}`;
    const needsRef = ['create_card', 'create_list', 'create_label', 'create_checklist',
                       'add_comment', 'assign_member', 'move_card'].includes(action);

    if (needsRef) {
      refCounters[prefix]++;
      return { ...step, ref: autoRef };
    }
    return step;
  });
}

export function resolveCrossPlanRefs(plans: PlanStep[][]): PlanStep[] {
  const merged: PlanStep[] = [];
  const refCounters: Record<string, number> = {};
  let globalStepIndex = 0;

  for (const plan of plans) {
    const localRefMap = new Map<string, string>();

    const injected = injectAutoRefs(plan);

    for (const step of injected) {
      const newStep = { ...step };

      if (step.ref) {
        const baseRef = step.ref.replace(/:\d+$/, '');
        if (!refCounters[baseRef]) refCounters[baseRef] = 0;
        const globalRef = `${baseRef}:${refCounters[baseRef]}`;
        localRefMap.set(step.ref, globalRef);
        newStep.ref = globalRef;
        refCounters[baseRef]++;
      }

      if (newStep.params) {
        newStep.params = resolveRefsInParams(newStep.params, localRefMap);
      }

      newStep.dependsOn = (step.dependsOn || []).map((d) => localRefMap.get(d) || d);

      merged.push(newStep);
      globalStepIndex++;
    }
  }

  return merged;
}

function resolveRefsInParams(
  params: Record<string, unknown>,
  refMap: Map<string, string>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'string' && val.startsWith('ref:')) {
      const localRef = val.slice(4);
      resolved[key] = `ref:${refMap.get(localRef) || localRef}`;
    } else {
      resolved[key] = val;
    }
  }
  return resolved;
}

export function extractChainArgs(args: Record<string, unknown>): Record<string, unknown>[] {
  const subArgsList: Record<string, unknown>[] = [];
  const base = { ...args };

  if (args.member || args.comment) {
    const first: Record<string, unknown> = { task: base.task, desc: base.desc, list: base.list };

    if (base.member) {
      subArgsList.push({ member: base.member, cardId: 'ref:card:0' });
    }
    if (base.comment) {
      subArgsList.push({ text: base.comment, cardId: 'ref:card:0' });
    }

    return [first, ...subArgsList];
  }

  return [];
}


