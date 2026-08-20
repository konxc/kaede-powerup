/**
 * KAEDE — API Dashboard (SolidJS)
 *
 * Migrasi dari public/dashboard.html (AlpineJS → SolidJS). Perilaku identik,
 * dengan satu perbaikan konsistensi: /api/mcp mengembalikan envelope
 * { success, results }, jadi setiap hasil intent di-resolve dulu (sama seperti
 * board.html & mcp-client.listBoards). Di versi lama, envelope difilter
 * langsung sehingga breakdown board tidak pernah termuat.
 *
 * Fitur: status MCP server, auth Trello, pemilih board, statistik per-list,
 * playbook enforcement, execution history, dan quick actions.
 */
import { createSignal, For, onMount, Show } from 'solid-js';
import { KAEDEMCP } from '../lib/mcp-client';

interface BoardItem {
  id: string;
  name: string;
}

interface ListData {
  name: string;
  color: string;
  cards: any[];
  overdue: number;
  assigned: number;
}

interface EnforcementState {
  safe: boolean;
  warnings: Array<{ type: string; message: string }>;
  blockers: Array<{ type: string; message: string }>;
}

interface HistoryEntry {
  success: boolean;
  intent?: string;
  action?: string;
  timestamp?: string;
  duration?: number;
}

/** Resolve /api/mcp envelope menjadi data mentah (sama untuk local + proxy). */
function resolveIntentResults(res: any): any {
  if (!res || res.success === false) throw new Error((res && res.error) || 'intent failed');
  const r = res.results;
  if (Array.isArray(r) && r.length && r[0] && typeof r[0] === 'object' && 'success' in r[0]) {
    if (r[0].success === false) throw new Error(r[0].error || 'Intent failed');
    return r[0].detail;
  }
  return r;
}

const COLORS = ['#6c5ce7', '#00b894', '#fdcb6e', '#ff7675', '#74b9ff', '#a29bfe', '#fd79a8', '#e17055'];

export default function Dashboard() {
  const [apiBase, setApiBase] = createSignal<string>(localStorage.getItem('kaede_api_base') || 'http://localhost:3456');
  const [connected, setConnected] = createSignal(false);
  const [serverVersion, setServerVersion] = createSignal('');
  const [boards, setBoards] = createSignal<BoardItem[]>([]);
  const [selectedBoardId, setSelectedBoardId] = createSignal('');
  const [boardData, setBoardData] = createSignal<{ lists: ListData[] }>({ lists: [] });
  const [listStats, setListStats] = createSignal<Array<{ name: string; count: number }>>([]);
  const [totalCards, setTotalCards] = createSignal(0);
  const [enforcement, setEnforcement] = createSignal<EnforcementState>({ safe: true, warnings: [], blockers: [] });
  const [execHistory, setExecHistory] = createSignal<HistoryEntry[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [lastUpdated, setLastUpdated] = createSignal('');
  const [quickResult, setQuickResult] = createSignal('');

  async function loadBoardData() {
    if (!selectedBoardId()) return;

    try {
      const listsRes = await KAEDEMCP.callIntent('get_board_lists', { boardId: selectedBoardId() });
      const lists = resolveIntentResults(listsRes);
      const openLists = (lists || []).filter(function (l: any) {
        return !l.closed;
      });

      const listData = await Promise.all(
        openLists.map(function (list: any, i: number) {
          return KAEDEMCP.callIntent('get_cards_by_list', { listId: list.id }).then(function (cardsRes: any) {
            const cards = resolveIntentResults(cardsRes);
            return {
              name: list.name,
              color: COLORS[i % COLORS.length],
              cards,
              overdue: cards.filter(function (c: any) {
                return c.due && !c.dueComplete && new Date(c.due) < new Date();
              }).length,
              assigned: cards.filter(function (c: any) {
                return c.idMembers && c.idMembers.length > 0;
              }).length,
            } as ListData;
          });
        }),
      );

      setBoardData({ lists: listData });
      const total = listData.reduce(function (sum, l) {
        return sum + l.cards.length;
      }, 0);
      setTotalCards(total);
      setListStats([
        { name: 'Total Lists', count: listData.length },
        { name: 'Total Cards', count: total },
        { name: 'Overdue', count: listData.reduce(function (s, l) { return s + l.overdue; }, 0) },
        { name: 'Assigned', count: listData.reduce(function (s, l) { return s + l.assigned; }, 0) },
      ]);
    } catch (e) {
      console.error('Board load failed:', e);
    }
  }

  async function refresh() {
    setLoading(true);
    localStorage.setItem('kaede_api_base', apiBase());

    try {
      const health = await KAEDEMCP.health();
      setConnected(true);
      setServerVersion(health.version || '?');
    } catch (e) {
      setConnected(false);
    }

    if (connected()) {
      try {
        setBoards(await KAEDEMCP.listBoards());
      } catch (e) {
        /* ignore */
      }
    }

    if (selectedBoardId()) await loadBoardData();
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }

  async function init() {
    try {
      const data = await KAEDEMCP.health();
      setConnected(true);
      setServerVersion(data.version || '?');
      setBoards(await KAEDEMCP.listBoards());
    } catch (e) {
      setConnected(false);
    }
  }

  async function quickAction(action: string) {
    try {
      const result = await KAEDEMCP.callTool(action, {});
      setQuickResult(JSON.stringify(result, null, 2));
    } catch (e) {
      setQuickResult('Error: ' + (e as Error).message);
    }
  }

  function clearHistory() {
    KAEDEMCP.callTool('clear_execution_history', {})
      .then(function () {
        setExecHistory([]);
      })
      .catch(function () {
        /* ignore */
      });
  }

  onMount(function () {
    KAEDEMCP.init(null).then(init);
  });

  const issuesCount = () => enforcement().warnings.length + enforcement().blockers.length;

  return (
    <div class="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <span class="flex items-center justify-center size-8 rounded-lg bg-kaede-primary text-white text-sm font-bold">K</span>
          <div>
            <h1 class="text-xl font-bold">KAEDE Dashboard</h1>
            <p class="text-xs text-kaede-muted">
              Sprint metrics &amp; MCP server status{' '}
              <span class="ml-1 px-1.5 py-0.5 rounded bg-kaede-warning/15 text-kaede-warning text-[10px] uppercase tracking-wide">dev-local</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-kaede-muted">{lastUpdated() ? 'Last updated: ' + lastUpdated() : ''}</span>
          <button
            onClick={refresh}
            disabled={loading()}
            class="px-3 py-1.5 rounded-lg bg-kaede-primary text-white text-xs font-medium cursor-pointer border-none transition-colors hover:bg-kaede-primary-hover disabled:opacity-40"
          >
            {loading() ? '…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Connection & Config */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="glass rounded-xl p-4">
          <div class="text-[10px] font-semibold uppercase tracking-wide text-kaede-muted mb-2">MCP Server</div>
          <div class="flex items-center gap-2">
            <span class={'size-2.5 rounded-full ' + (connected() ? 'bg-kaede-success' : 'bg-kaede-warning')}></span>
            <span class="text-sm font-medium">{connected() ? 'Connected v' + serverVersion() : 'Not connected'}</span>
          </div>
          <input
            type="text"
            value={apiBase()}
            onInput={(e) => setApiBase(e.currentTarget.value)}
            class="w-full mt-2 px-2 py-1 rounded border border-kaede-border bg-kaede-surface text-xs text-kaede-text outline-none focus:border-kaede-primary"
            placeholder="http://localhost:3456"
          />
        </div>

        <div class="glass rounded-xl p-4">
          <div class="text-[10px] font-semibold uppercase tracking-wide text-kaede-muted mb-2">Trello Auth</div>
          <div class="flex items-center gap-2">
            <span class={'size-2.5 rounded-full ' + (connected() ? 'bg-kaede-success' : 'bg-kaede-warning')}></span>
            <span class="text-sm font-medium">{connected() ? 'Server-held' : 'No server'}</span>
          </div>
          <p class="text-[10px] text-kaede-muted mt-1">
            Kredensial dipegang server (secrets.env / env Netlify) — tidak ada prompt key/token di browser
          </p>
        </div>

        <div class="glass rounded-xl p-4">
          <div class="text-[10px] font-semibold uppercase tracking-wide text-kaede-muted mb-2">Board</div>
          <select
            value={selectedBoardId()}
            onChange={(e) => {
              setSelectedBoardId(e.currentTarget.value);
              loadBoardData();
            }}
            class="w-full px-2 py-1.5 rounded border border-kaede-border bg-kaede-surface text-xs text-kaede-text outline-none focus:border-kaede-primary"
          >
            <option value="">Select board...</option>
            <For each={boards()}>
              {(b) => <option value={b.id}>{b.name}</option>}
            </For>
          </select>
          <p class="text-[10px] text-kaede-muted mt-1" classList={{ hidden: boards().length > 0 }}>
            Boards dimuat via server (list_boards)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <For each={listStats()}>
          {(stat) => (
            <div class="glass rounded-xl p-4 text-center">
              <div class="text-2xl font-bold">{stat.count}</div>
              <div class="text-[10px] text-kaede-muted uppercase tracking-wide mt-1">{stat.name}</div>
            </div>
          )}
        </For>
      </div>

      {/* Per-List Breakdown */}
      <div class="glass rounded-xl p-5 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold">Per-List Breakdown</h2>
          <span class="text-[10px] text-kaede-muted">{totalCards() + ' total cards'}</span>
        </div>

        <For each={boardData().lists}>
          {(listItem) => (
            <div class="flex items-center justify-between py-2.5 border-b border-kaede-border/30 last:border-0">
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full" style={{ background: listItem.color }}></span>
                <span class="text-sm">{listItem.name}</span>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <span class="font-medium">{listItem.cards.length + ' cards'}</span>
                <Show when={listItem.overdue > 0}>
                  <span class="px-1.5 py-0.5 rounded bg-kaede-danger/15 text-kaede-danger">{listItem.overdue + ' overdue'}</span>
                </Show>
                <Show when={listItem.assigned > 0}>
                  <span class="px-1.5 py-0.5 rounded bg-kaede-primary/15 text-kaede-primary">{listItem.assigned + ' assigned'}</span>
                </Show>
              </div>
            </div>
          )}
        </For>

        <Show when={!boardData().lists || boardData().lists.length === 0}>
          <p class="text-xs text-kaede-muted text-center py-4">No lists found. Select a board.</p>
        </Show>
      </div>

      {/* Enforcement */}
      <Show when={enforcement().warnings.length > 0 || enforcement().blockers.length > 0}>
        <div class="glass rounded-xl p-5 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold">Playbook Enforcement</h2>
            <span
              class={'text-[10px] font-semibold uppercase px-2 py-0.5 rounded ' + (enforcement().safe ? 'bg-kaede-success/20 text-kaede-success' : 'bg-kaede-warning/20 text-kaede-warning')}
            >
              {enforcement().safe ? 'Compliant' : issuesCount() + ' issues'}
            </span>
          </div>

          <For each={enforcement().warnings}>
            {(w) => (
              <div class="flex items-start gap-2 py-1.5 text-xs">
                <span class="text-kaede-warning shrink-0 mt-px">&#9888;</span>
                <span class="text-kaede-muted">
                  <span class="font-medium text-kaede-text capitalize">{w.type.replace(/_/g, ' ')}</span>:{' '}
                  <span>{w.message}</span>
                </span>
              </div>
            )}
          </For>
          <For each={enforcement().blockers}>
            {(b) => (
              <div class="flex items-start gap-2 py-1.5 text-xs">
                <span class="text-kaede-danger shrink-0 mt-px font-bold">!</span>
                <span class="text-kaede-muted">
                  <span class="font-medium text-kaede-text capitalize">{b.type.replace(/_/g, ' ')}</span>:{' '}
                  <span>{b.message}</span>
                </span>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Execution History */}
      <Show when={execHistory().length > 0}>
        <div class="glass rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold">Execution History</h2>
            <button
              onClick={clearHistory}
              class="text-[10px] text-kaede-muted hover:text-kaede-danger underline cursor-pointer bg-transparent border-none"
            >
              Clear
            </button>
          </div>

          <For each={execHistory()}>
            {(entry, i) => (
              <div class="flex items-start gap-3 py-2 border-b border-kaede-border/30 last:border-0">
                <span class={'size-2 rounded-full mt-1 ' + (entry.success ? 'bg-kaede-success' : 'bg-kaede-danger')}></span>
                <div class="min-w-0">
                  <div class="text-xs font-medium truncate">{entry.intent || entry.action}</div>
                  <div class="text-[10px] text-kaede-muted">
                    <span>{entry.timestamp || ''}</span>
                    <Show when={entry.duration}>
                      <span> &middot; <span>{entry.duration + 'ms'}</span></span>
                    </Show>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Quick Actions */}
      <div class="mt-8 glass rounded-xl p-5">
        <h2 class="text-sm font-semibold mb-3">Quick Actions</h2>
        <div class="flex flex-wrap gap-2">
          <button
            onClick={() => quickAction('generate_sprint_report')}
            class="px-3 py-1.5 rounded-lg bg-kaede-primary/20 text-kaede-primary text-xs font-medium cursor-pointer border-none transition-colors hover:bg-kaede-primary/30"
          >
            Sprint Report
          </button>
          <button
            onClick={() => quickAction('detect_duplicates')}
            class="px-3 py-1.5 rounded-lg border border-kaede-border text-kaede-muted text-xs font-medium cursor-pointer transition-colors hover:border-kaede-primary"
          >
            Detect Duplicates
          </button>
          <button
            onClick={() => quickAction('get_execution_history')}
            class="px-3 py-1.5 rounded-lg border border-kaede-border text-kaede-muted text-xs font-medium cursor-pointer transition-colors hover:border-kaede-primary"
          >
            Show History
          </button>
        </div>
        <Show when={quickResult()}>
          <div class="mt-3 p-3 bg-kaede-surface rounded-lg text-xs text-kaede-muted leading-relaxed max-h-48 overflow-y-auto">
            <pre class="whitespace-pre-wrap">{quickResult()}</pre>
          </div>
        </Show>
      </div>
    </div>
  );
}
