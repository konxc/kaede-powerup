/**
 * KAEDE — Authorize (SolidJS)
 *
 * Migrasi dari public/auth.html. Perilaku identik:
 *   - Konfigurasi MCP Server URL (kosong = auto-detect).
 *   - Otorisasi Trello per-user (member-private token, least-privilege).
 *   - Connect Board / Authorize Trello / Remove Authorization.
 */
import { createSignal, Show } from 'solid-js';
import { authorizeTrello } from '../lib/trello';

export default function Auth() {
  const t = window.TrelloPowerUp.iframe();

  const [unauthorized, setUnauthorized] = createSignal(true);
  const [trelloAuthorized, setTrelloAuthorized] = createSignal(false);
  const [apiBase, setApiBase] = createSignal('');
  const [error, setError] = createSignal('');

  function showError(err: unknown) {
    setError(err && (err as Error).message ? (err as Error).message : String(err));
  }

  function checkAuth(): Promise<void> {
    return Promise.all([
      t.get('board', 'shared', 'auth', null),
      t.get('member', 'private', 'kaede_token', ''),
    ])
      .then(function (results) {
        const auth = results[0];
        setTrelloAuthorized(!!results[1]);
        if (auth && auth.connected && results[1]) {
          setUnauthorized(false);
        }
      })
      .catch(function () {
        /* ignore */
      });
  }

  function connectBoard() {
    setError('');
    Promise.all([
      t.set('board', 'shared', 'auth', {
        connected: true,
        provider: 'kaede-proxy',
        version: '1.1.0',
      }),
      t.set('board', 'shared', 'apiBase', apiBase() ? apiBase().replace(/\/+$/, '') : null),
    ])
      .then(function () {
        return checkAuth();
      })
      .catch(function (err: unknown) {
        console.error('[KAEDE] Connect failed:', err);
        showError(err);
      });
  }

  function authorizeTrelloAccount() {
    setError('');
    setTrelloAuthorized(false);
    authorizeTrello(t)
      .then(function () {
        setTrelloAuthorized(true);
      })
      .catch(function (err: unknown) {
        console.error('[KAEDE] Trello auth failed:', err);
        setTrelloAuthorized(false);
        showError(err);
      });
  }

  function deauthorize() {
    Promise.all([
      t.set('board', 'shared', 'auth', null),
      t.set('board', 'shared', 'apiBase', null),
      t.set('member', 'private', 'kaede_token', null),
    ])
      .then(function () {
        setApiBase('');
        setTrelloAuthorized(false);
        setUnauthorized(true);
      })
      .catch(function (err: unknown) {
        console.error('[KAEDE] Deauth failed:', err);
      });
  }

  checkAuth();

  return (
    <>
    <div class="flex-1 flex flex-col items-center justify-center">
      <div class="flex items-center justify-center size-10 rounded-lg bg-kaede-primary/20 text-kaede-primary mb-3">
        <span class="text-sm font-bold">K</span>
      </div>

      <Show
        when={unauthorized()}
        fallback={
          <div>
            <div class="flex items-center justify-center size-10 rounded-full bg-kaede-success/20 text-kaede-success mb-3">
              <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-base font-semibold text-kaede-text mb-2">Board Connected</h2>
            <p class="text-sm text-kaede-muted mb-4">
              Board terhubung ke KAEDE &mdash; akun Trello Anda sudah diotorisasi.
            </p>
            <button
              type="button"
              onClick={deauthorize}
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-kaede-danger/50 text-kaede-danger text-sm font-medium bg-transparent cursor-pointer transition-colors duration-200 hover:bg-kaede-danger/10"
            >
              Remove Authorization
            </button>
          </div>
        }
      >
        <div>
          <h2 class="text-base font-semibold text-kaede-text mb-2">Connect KAEDE</h2>
          <p class="text-sm text-kaede-muted leading-relaxed mb-4">
            Konfigurasi <strong class="text-kaede-text">MCP Server</strong> dan authorize akun Trello{' '}
            <strong class="text-kaede-text">Anda sendiri</strong> (per-user OAuth). Token per-user disimpan
            member-private &mdash; hanya Anda yang bisa membacanya, dan hanya data milik Anda yang terlihat
            (least-privilege).
          </p>

          <div class="text-left bg-kaede-bg rounded-md p-3 mb-3 border border-kaede-border/50 text-[11px]">
            <div class="mb-3">
              <label class="text-kaede-text font-medium text-xs">MCP Server URL</label>
              <input
                type="text"
                value={apiBase()}
                onInput={(e) => setApiBase(e.currentTarget.value)}
                placeholder="http://localhost:3456"
                class="w-full mt-1 px-2 py-1.5 rounded border border-kaede-border bg-kaede-surface text-kaede-text text-xs outline-none focus:border-kaede-primary"
              />
              <p class="text-kaede-muted mt-1 leading-relaxed">
                Kosongkan untuk auto-detect (localhost &rarr; lokal, lainnya &rarr; Netlify proxy).
              </p>
            </div>
          </div>

          <div class="text-left bg-kaede-bg rounded-md p-3 mb-4 border border-kaede-border/50 text-[11px]">
            <div class="flex items-center justify-between">
              <label class="text-kaede-text font-medium text-xs">Trello Authorization (per-user)</label>
              <span
                class={'px-1.5 py-0.5 rounded text-[10px] ' + (trelloAuthorized() ? 'bg-kaede-success/20 text-kaede-success' : 'bg-kaede-warning/15 text-kaede-warning')}
              >
                {trelloAuthorized() ? 'Authorized' : 'Not authorized'}
              </span>
            </div>
            <p class="text-kaede-muted mt-1 leading-relaxed">
              Popup OAuth Trello untuk akun Anda. Scope: baca + tulis. Diizinkan untuk Power-Up KAEDE saja.
            </p>
          </div>

          <div class="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={connectBoard}
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-none bg-kaede-primary text-white text-sm font-medium cursor-pointer transition-colors duration-200 hover:bg-kaede-primary-hover"
            >
              Connect Board
            </button>
            <button
              type="button"
              onClick={authorizeTrelloAccount}
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-kaede-border text-kaede-text text-sm font-medium bg-transparent cursor-pointer transition-colors duration-200 hover:border-kaede-primary"
            >
              Authorize Trello
            </button>
          </div>
          <Show when={error()}>
            <p class="text-kaede-danger text-[11px] mt-2">{error()}</p>
          </Show>
        </div>
      </Show>
    </div>

    <div class="pt-3 border-t border-kaede-border/50 text-center">
      <a
        href="/"
        target="_blank"
        rel="noopener"
        class="text-[10px] text-kaede-muted hover:text-kaede-primary no-underline transition-colors"
      >
        About KAEDE Ecosystem
      </a>
    </div>
    </>
  );
}
