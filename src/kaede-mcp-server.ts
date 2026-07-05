#!/usr/bin/env bun

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  handleStatus,
  handleParsePlaybook,
  handleBundleContext,
  handleResolveBoard,
  handleResolveContext,
} from './tool-handlers/context';
import {
  handleGeneratePlan,
  handleExecutePlan,
  handleUndoLastPlan,
  handleGetExecutionHistory,
  handleClearExecutionHistory,
} from './tool-handlers/plan';
import {
  handleFindCard,
  handleDetectDuplicates,
  handleValidateContext,
  handleArchiveDuplicates,
} from './tool-handlers/duplicate';
import { handleGenerateTemplate, handleLoadTemplates } from './tool-handlers/template';
import { handleGenerateSprintReport, handleBatchUpdateCards } from './tool-handlers/report';
import { handleEnforcePlaybook } from './tool-handlers/enforcer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const VERSION = '2024-11-05';
const SERVER = { name: 'KAEDE Orchestrator MCP', version: '1.0.0' as const };

interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: boolean;
    $schema: string;
  };
}

function send(msg: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function error(id: number | string | null, code: number, message: string): void {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

function result(id: number | string | null, data: unknown): void {
  send({ jsonrpc: '2.0', id, result: data });
}

function toolSchema(name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []): ToolSchema {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
      $schema: 'http://json-schema.org/draft-07/schema#',
    },
  };
}

const TOOLS: ToolSchema[] = [
  toolSchema(
    'parse_playbook',
    'Parse a playbook markdown document into structured data (roles, workflow lists, conventions, labels)',
    {
      content: { type: 'string', description: 'Playbook markdown content' },
    },
    ['content'],
  ),

  toolSchema(
    'bundle_context',
    'Load and combine project context from playbook, OpenKB, and OpenCode config. playbookPath can be a .md file or a directory (all .md files merged automatically). Use resolve_board first to find the correct board, then pass its playbook path here.',
    {
      playbookPath: { type: 'string', description: 'Path to playbook markdown file or directory of .md files' },
      openkbPath: { type: 'string', description: 'Path to .openkb directory' },
      opencodePath: { type: 'string', description: 'Path to .opencode directory' },
      boardName: { type: 'string', description: 'HINT: Nama board setelah di-resolve via search_boards. Tidak otomatis resolve, hanya untuk dokumentasi alur.' },
    },
  ),

  toolSchema(
    'generate_plan',
    'Generate a context-aware execution plan from a natural language goal and playbook. Jika parameter boards disertakan, pre-flight duplicate detection otomatis berjalan untuk create_card / create_label.',
    {
      goal: {
        type: 'string',
        description:
          'Natural language goal/intent. Examples: "mulai sprint", "buat card", "buat board", "assign", "pindah", "komentar", "buat label", "arsipkan", "tutup sprint", "report", "buat checklist"',
      },
      playbook: { type: 'string', description: 'Playbook markdown content for context-aware planning' },
      task: { type: 'string', description: 'Task/card name for "buat card"' },
      name: { type: 'string', description: 'Name for "buat board", "buat label"' },
      desc: { type: 'string', description: 'Description for "buat card"' },
      list: { type: 'string', description: 'Target list name for "buat card", "pindah"' },
      member: { type: 'string', description: 'Member name/ID for "assign"' },
      memberId: { type: 'string', description: 'Member ID for "hapus anggota"' },
      color: {
        type: 'string',
        description: 'Color for "buat label" (red, orange, yellow, green, blue, purple, pink, lime, sky, black)',
      },
      cardId: { type: 'string', description: 'Card name/ID for "pindah", "arsipkan", "komentar", "update card"' },
      text: { type: 'string', description: 'Comment text for "komentar"' },
      from: { type: 'string', description: 'Source list name for "pindah semua"' },
      to: { type: 'string', description: 'Target list name for "pindah semua"' },
      items: { type: 'array',       items: { type: 'string' }, description: 'Checklist items for "buat checklist"' },
      cards: {
        type: 'array',
        description: 'Array of cards for batch/composite intents ("buat cards batch", "setup sprint"). Each card can include task, desc, list, start, due, checklist[], comment, labels[].',
        items: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'Card title' },
            desc: { type: 'string', description: 'Card description' },
            list: { type: 'string', description: 'Target list name' },
            start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            due: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
            checklist: { type: 'array', items: { type: 'string' }, description: 'Checklist items' },
            comment: { type: 'string', description: 'Comment text to add after creation' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Label names' },
          },
          required: ['task'],
        },
      },
      boardNames: {
        type: 'array',
        items: { type: 'string' },
        description: 'Board names for multi-board composite intents ("setup sprint")',
      },
      boards: {
        type: 'array',
        description: 'Board snapshots for pre-flight duplicate detection. Jika disertakan, generatePlan akan auto-check konflik sebelum create_card/create_label.',
        items: {
          type: 'object',
          properties: {
            boardId: { type: 'string' },
            boardName: { type: 'string' },
            lists: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  listId: { type: 'string' },
                  listName: { type: 'string' },
                  cards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        desc: { type: 'string' },
                        listName: { type: 'string' },
                        boardName: { type: 'string' },
                      },
                      required: ['id', 'name'],
                    },
                  },
                },
                required: ['listId', 'listName', 'cards'],
              },
            },
          },
          required: ['boardId', 'boardName', 'lists'],
        },
      },
    },
    ['goal'],
  ),

  toolSchema('status', 'Check KAEDE status — version, playbook/openkb paths accessibility'),

  toolSchema(
    'resolve_board',
    'Parse a natural language board description into structured search keywords. Use the returned keywords with search_boards or list_boards(nameFilter) on mcp.trello to find the right board.',
    {
      description: {
        type: 'string',
        description: 'Natural language board description, e.g. "board backend untuk project SMART Presensi"',
      },
    },
    ['description'],
  ),

  toolSchema(
    'find_card',
    'Search for a card by name across board snapshots. Returns exact match + similar matches for duplicate detection.',
    {
      cards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            listName: { type: 'string' },
            listId: { type: 'string' },
            boardId: { type: 'string' },
            boardName: { type: 'string' },
          },
          required: ['id', 'name'],
        },
        description: 'Array of cards to search in',
      },
      query: { type: 'string', description: 'Card name to search for' },
    },
    ['cards', 'query'],
  ),

  toolSchema(
    'detect_duplicates',
    'Scan board snapshots for duplicate cards (same name in same list, cross-list, or cross-board).',
    {
      boards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            boardId: { type: 'string' },
            boardName: { type: 'string' },
            lists: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  listId: { type: 'string' },
                  listName: { type: 'string' },
                  cards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        desc: { type: 'string' },
                        listName: { type: 'string' },
                        boardName: { type: 'string' },
                      },
                      required: ['id', 'name'],
                    },
                  },
                },
                required: ['listId', 'listName', 'cards'],
              },
            },
          },
          required: ['boardId', 'boardName', 'lists'],
        },
        description: 'Board snapshots with lists and cards',
      },
    },
    ['boards'],
  ),

  toolSchema(
    'validate_context',
    'Pre-flight validation before creating cards/labels/boards. Checks for duplicates, naming conventions, and cross-board conflicts.',
    {
      action: {
        type: 'string',
        description: 'Action to validate: "create_card", "create_label", "create_board"',
      },
      params: {
        type: 'object',
        description: 'Parameters for the action (name, listName, color, etc.)',
      },
      boards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            boardId: { type: 'string' },
            boardName: { type: 'string' },
            lists: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  listId: { type: 'string' },
                  listName: { type: 'string' },
                  cards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        listName: { type: 'string' },
                        boardName: { type: 'string' },
                      },
                      required: ['id', 'name'],
                    },
                  },
                },
                required: ['listId', 'listName', 'cards'],
              },
            },
          },
          required: ['boardId', 'boardName', 'lists'],
        },
        description: 'Board snapshots to validate against',
      },
    },
    ['action', 'params', 'boards'],
  ),

  toolSchema(
    'archive_duplicates',
    'Generate an archive plan for duplicate cards. Specify which card to keep per group (oldest, newest, longest_desc).',
    {
      groups: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Original card name' },
            count: { type: 'number' },
            location: { type: 'string', enum: ['sameList', 'crossList', 'crossBoard'] },
            cards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  desc: { type: 'string' },
                  listName: { type: 'string' },
                  boardName: { type: 'string' },
                },
                required: ['id', 'name'],
              },
            },
          },
          required: ['name', 'count', 'location', 'cards'],
        },
        description: 'Duplicate groups from detect_duplicates output',
      },
      keepStrategy: {
        type: 'string',
        enum: ['oldest', 'newest', 'longest_desc'],
        description: 'Strategy to pick which card to keep (default: oldest)',
      },
    },
    ['groups'],
  ),

  toolSchema(
    'generate_template',
    'Generate card description, acceptance criteria checklist, and comment from a built-in template. Use templates to auto-populate Trello cards with consistent structure based on playbook conventions.',
    {
      template: {
        type: 'string',
        description: 'Template name: "feature", "bug", "task", "chore", "onboarding", "user-story", "sprint-planning", "sprint-retro", "daily-standup", or any loaded user-defined template',
      },
      task: { type: 'string', description: 'Card title / task name' },
      role: { type: 'string', description: 'User role for user story (feature/user-story template)' },
      want: { type: 'string', description: 'What user wants (feature/bug template)' },
      benefit: { type: 'string', description: 'Why / benefit (all templates)' },
      feature: { type: 'string', description: 'Feature name or area' },
      techStack: { type: 'string', description: 'Technology stack' },
      convention: { type: 'string', description: 'Coding conventions to follow' },
      reference: { type: 'string', description: 'Reference docs or links' },
      priority: { type: 'string', description: 'Priority level' },
      assignee: { type: 'string', description: 'Assigned team member' },
      sprint: { type: 'string', description: 'Sprint name/number' },
      technologies: { type: 'string', description: 'Technologies list (sprint-planning template)' },
    },
    ['template', 'task'],
  ),

  toolSchema(
    'resolve_context',
    'Resolve board/list names from context and playbook. Auto-fills missing parameters, infers template from goal, and returns resolved context with confidence level.',
    {
      goal: { type: 'string', description: 'Natural language goal/intent' },
      boardName: { type: 'string', description: 'Target board name (optional — auto-resolves)' },
      list: { type: 'string', description: 'Target list name (optional — uses playbook default)' },
      boards: {
        type: 'array',
        description: 'Board specs for resolution',
        items: {
          type: 'object',
          properties: {
            boardId: { type: 'string' },
            boardName: { type: 'string' },
          },
          required: ['boardId', 'boardName'],
        },
      },
      playbook: { type: 'string', description: 'Playbook markdown for list resolution' },
    },
    ['goal'],
  ),

  toolSchema(
    'execute_plan',
    'Execute a multi-step plan with dependency tracking and multi-board support. Pass the plan from generate_plan output, plus board specs with real boardIds. Steps with refs auto-resolve dependant steps. Returns refMap mapping ref → realId for downstream use.',
    {
      plan: {
        type: 'array',
        description: 'Array of PlanStep from generate_plan output (action, params, description, ref?, dependsOn?)',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Action to execute (create_card, create_list, create_label, create_checklist, add_comment, move_card, archive_card, assign_member, update_card)' },
            params: { type: 'object', description: 'Parameters for the action' },
            description: { type: 'string', description: 'Human-readable description' },
            ref: { type: 'string', description: 'Reference ID for dependency tracking (e.g. "card:0")' },
            dependsOn: { type: 'array', items: { type: 'string' }, description: 'Array of refs this step depends on' },
          },
          required: ['action', 'params', 'description'],
        },
      },
      boards: {
        type: 'array',
        description: 'Board specifications with real boardIds. Required for multi-board plans.',
        items: {
          type: 'object',
          properties: {
            boardId: { type: 'string', description: 'Real Trello board ID' },
            boardName: { type: 'string', description: 'Board name (to match boardName in plan params)' },
          },
          required: ['boardId', 'boardName'],
        },
      },
    },
    ['plan'],
  ),

  toolSchema(
    'undo_last_plan',
    'Undo the last executed plan by reversing each action. Supports create_card → archive, move_card, assign_member, create_checklist, create_list, and more. Only reversible steps are undone.',
  ),

  toolSchema(
    'generate_sprint_report',
    'Generate a formatted sprint report (markdown) from Trello board data. Groups cards by list, calculates overdue/completed counts, and breaks down by label.',
    {
      boardId: { type: 'string', description: 'Trello board ID' },
      listNames: { type: 'array', items: { type: 'string' }, description: 'List names to include (empty = all lists)' },
      sprintName: { type: 'string', description: 'Sprint name for the report header' },
    },
    ['boardId'],
  ),

  toolSchema(
    'batch_update_cards',
    'Batch update/move multiple Trello cards based on filters. Supports: move to list, add/remove labels, set name/description/due/start. Filters by list name, member, due date.',
    {
      boardId: { type: 'string', description: 'Trello board ID' },
      filterList: { type: 'string', description: 'Source list name filter' },
      memberId: { type: 'string', description: 'Filter by assigned member ID' },
      dueBefore: { type: 'string', description: 'Filter: due before date (ISO)' },
      dueAfter: { type: 'string', description: 'Filter: due after date (ISO)' },
      moveToListName: { type: 'string', description: 'Move cards to this list' },
      addLabels: { type: 'array', items: { type: 'string' }, description: 'Label names to add' },
      removeLabels: { type: 'array', items: { type: 'string' }, description: 'Label names to remove' },
      setName: { type: 'string', description: 'Set card name (use {{name}} for original)' },
      setDesc: { type: 'string', description: 'Set card description' },
      setDue: { type: 'string', description: 'Set due date (ISO)' },
      setStart: { type: 'string', description: 'Set start date (YYYY-MM-DD)' },
    },
    ['boardId'],
  ),

  toolSchema(
    'load_templates',
    'Load user-defined card templates from a directory of markdown files. Each .md file becomes a named template usable in generate_plane and generate_template.',
    {
      dirPath: { type: 'string', description: 'Path to directory containing .md template files' },
    },
    ['dirPath'],
  ),

  toolSchema(
    'get_execution_history',
    'View execution history of previously executed plans. Returns up to 10 recent entries with step details.',
  ),

  toolSchema(
    'clear_execution_history',
    'Clear all stored execution history. Use with caution — undo_last_plan will not work after clearing.',
  ),

  toolSchema(
    'enforce_playbook',
    'Validate a plan or board snapshot against playbook conventions. Checks title prefixes, allowed labels, workflow list compliance, and role-based access. Returns structured enforcement warnings.',
    {
      plan: {
        type: 'array',
        description: 'Array of PlanStep to validate (action, params)',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            params: { type: 'object' },
            description: { type: 'string' },
          },
          required: ['action'],
        },
      },
      playbook: { type: 'string', description: 'Playbook markdown content to validate against' },
      boards: {
        type: 'array',
        description: 'Optional board snapshots for board-level validation (existing cards)',
        items: {
          type: 'object',
          properties: {
            boardId: { type: 'string' },
            boardName: { type: 'string' },
            lists: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  listId: { type: 'string' },
                  listName: { type: 'string' },
                  cards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        listName: { type: 'string' },
                        boardName: { type: 'string' },
                      },
                      required: ['id', 'name'],
                    },
                  },
                },
                required: ['listId', 'listName', 'cards'],
              },
            },
          },
          required: ['boardId', 'boardName', 'lists'],
        },
      },
    },
    ['playbook'],
  ),
];

type ToolHandler = (args: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  status: handleStatus,
  parse_playbook: handleParsePlaybook,
  bundle_context: handleBundleContext,
  resolve_board: handleResolveBoard,
  resolve_context: handleResolveContext,

  generate_plan: handleGeneratePlan,
  execute_plan: handleExecutePlan,
  undo_last_plan: handleUndoLastPlan,
  get_execution_history: handleGetExecutionHistory,
  clear_execution_history: handleClearExecutionHistory,

  find_card: handleFindCard,
  detect_duplicates: handleDetectDuplicates,
  validate_context: handleValidateContext,
  archive_duplicates: handleArchiveDuplicates,

  generate_template: handleGenerateTemplate,
  load_templates: handleLoadTemplates,

  generate_sprint_report: handleGenerateSprintReport,
  batch_update_cards: handleBatchUpdateCards,

  enforce_playbook: handleEnforcePlaybook,
};

async function handleToolsCall(name: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const handler = TOOL_HANDLERS[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return await handler(args);
}

let buffer = '';
const stdin = process.stdin;
stdin.setEncoding('utf-8');

stdin.on('data', (chunk: string) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    let msg: { method?: string; id?: number; params?: Record<string, unknown> };
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }

    const method = msg.method;
    const id = msg.id ?? null;
    const params = msg.params || {};

    if (method === 'initialize') {
      result(id, {
        protocolVersion: VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER,
      });
    } else if (method === 'notifications/initialized') {
      // no response needed
    } else if (method === 'tools/list') {
      result(id, { tools: TOOLS });
    } else if (method === 'tools/call') {
      handleToolsCall(params.name as string, (params.arguments || {}) as Record<string, unknown>)
        .then((res) => {
          const content =
            typeof res === 'string'
              ? [{ type: 'text' as const, text: res }]
              : [{ type: 'text' as const, text: JSON.stringify(res, null, 2) }];
          result(id, { content });
        })
        .catch((err: Error) => {
          error(id, -32603, err.message);
        });
    } else {
      error(id, -32601, `Method not found: ${method}`);
    }
  }
});

stdin.on('end', () => {
  // Don't force exit — let pending async handlers complete naturally
});
