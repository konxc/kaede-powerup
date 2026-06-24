/**
 * KAEDE — Koneksi Automated Environment DE
 * Trello Power-Up capabilities & iframe connector.
 *
 * This script runs inside Trello's hidden iframe and registers
 * all capabilities that the Power-Up exposes to the Trello UI.
 *
 * @see https://developer.atlassian.com/cloud/trello/power-ups/
 */

/* global TrelloPowerUp */

// ===================================================================
//  Configuration
// ===================================================================

const KAEDE = {
  name: 'KAEDE',
  version: '1.0.0',
  icon: {
    dark: 'https://cdn.jsdelivr.net/gh/konxc/konxc.github.io@main/assets/kaede-icon-dark.svg',
    light: 'https://cdn.jsdelivr.net/gh/konxc/konxc.github.io@main/assets/kaede-icon-light.svg',
  },
  // Fallback icon (inline SVG data-uri) — purple box with "K"
  iconFallback: {
    dark: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjNmM1Y2U3Ii8+PHRleHQgeD0iNDklIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSI3MDAiPks8L3RleHQ+PC9zdmc+',
    light: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjNmM1Y2U3Ii8+PHRleHQgeD0iNDklIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSI3MDAiPks8L3RleHQ+PC9zdmc+',
  },
};

// ===================================================================
//  Storage helpers (scoped per board / card)
// ===================================================================

/**
 * Get a storage key-value pair scoped to the context.
 * @param {object} t — TrelloPowerUp iframe context
 * @param {string} scope — 'board' | 'card'
 * @param {string} key
 * @param {*}      [defaultValue]
 */
async function get(t, scope, key, defaultValue) {
  try {
    const val = await t.get(scope, 'shared', key);
    return val !== undefined && val !== null ? val : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Set a storage key-value pair scoped to the context.
 * @param {object} t — TrelloPowerUp iframe context
 * @param {string} scope — 'board' | 'card'
 * @param {string} key
 * @param {*}      value
 */
async function set(t, scope, key, value) {
  await t.set(scope, 'shared', key, value);
}

// ===================================================================
//  Capabilities
// ===================================================================

const capabilities = {
  // ---------------------------------------------------------------
  //  Board Button — opens the KAEDE dashboard
  // ---------------------------------------------------------------
  'board-buttons': function (t) {
    return [
      {
        icon: KAEDE.iconFallback.dark,
        text: 'KAEDE',
        callback: async function (t) {
          return t.popup({
            title: 'KAEDE Dashboard',
            url: 'board.html',
            height: 400,
          });
        },
        condition: 'edit',
      },
    ];
  },

  // ---------------------------------------------------------------
  //  Card Buttons — actions per-card
  // ---------------------------------------------------------------
  'card-buttons': function (t) {
    return [
      {
        icon: KAEDE.iconFallback.dark,
        text: 'KAEDE: Environment',
        callback: async function (t) {
          return t.popup({
            title: 'Environment Manager',
            url: 'card.html',
            height: 300,
          });
        },
        condition: 'edit',
      },
    ];
  },

  // ---------------------------------------------------------------
  //  Card Badge — show env status on card front
  // ---------------------------------------------------------------
  'card-badges': function (t) {
    return t.card('id', 'name')
      .then(async function (card) {
        const env = await get(t, 'card', 'environment', 'unset');

        const badgeMap = {
          production:  { text: 'PROD', color: 'red',    icon: KAEDE.iconFallback.dark },
          staging:     { text: 'STAG', color: 'yellow', icon: KAEDE.iconFallback.dark },
          development: { text: 'DEV',  color: 'green',  icon: KAEDE.iconFallback.dark },
          unset:       { text: '—',    color: 'gray',   icon: KAEDE.iconFallback.dark },
        };

        const badge = badgeMap[env] || badgeMap.unset;

        return [
          {
            text: badge.text,
            color: badge.color,
            icon: badge.icon,
            refresh: 30, // refresh every 30 seconds
          },
        ];
      });
  },

  // ---------------------------------------------------------------
  //  Show Card — detailed env info in card detail view
  // ---------------------------------------------------------------
  'show-card': function (t) {
    return t.card('id', 'name')
      .then(async function (card) {
        const env = await get(t, 'card', 'environment', 'unset');
        const deployUrl = await get(t, 'card', 'deployUrl', '');

        return {
          title: 'KAEDE: Environment',
          detail: [
            '<div style="padding:12px 0">',
            '  <div style="font-size:11px;font-weight:600;color:#8888a0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Environment</div>',
            '  <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase;background:' + (env === 'production' ? 'rgba(225,112,85,0.15);color:#e17055' : env === 'staging' ? 'rgba(253,203,110,0.15);color:#fdcb6e' : 'rgba(0,184,148,0.15);color:#00b894') + '">' + env.toUpperCase() + '</span>',
            '</div>',
            (deployUrl ? [
              '<div style="padding:12px 0">',
              '  <div style="font-size:11px;font-weight:600;color:#8888a0;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Deploy URL</div>',
              '  <a href="' + deployUrl + '" target="_blank" rel="noopener" style="color:#6c5ce7;text-decoration:underline">' + deployUrl + '</a>',
              '</div>',
            ].join('') : ''),
            '<div style="padding:12px 0">',
            '  <button data-action="kaede-set-env" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border:none;border-radius:8px;background:#6c5ce7;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:500;cursor:pointer">Set Environment</button>',
            '</div>',
          ].join('\n'),
        };
      });
  },

  // ---------------------------------------------------------------
  //  On enable / disable — lifecycle hooks
  // ---------------------------------------------------------------
  'on-enable': function (t) {
    console.log('[KAEDE] Power-Up enabled on board', t.getContext().board);
  },

  'on-disable': function (t) {
    console.log('[KAEDE] Power-Up disabled on board', t.getContext().board);
  },

  // ---------------------------------------------------------------
  //  Authorization — attach OAuth / API key flow here
  // ---------------------------------------------------------------
  'authorization-status': function (t) {
    return get(t, 'board', 'auth', null)
      .then(function (auth) {
        return {
          authorized: auth !== null,
        };
      });
  },

  'show-authorization': function (t) {
    return t.popup({
      title: 'KAEDE: Authorize',
      url: 'auth.html',
      height: 280,
    });
  },

  // ---------------------------------------------------------------
  //  Locale / translations (stub)
  // ---------------------------------------------------------------
  'locale': function (t) {
    return {
      'kaede:environment': 'Environment',
      'kaede:production':  'Production',
      'kaede:staging':     'Staging',
      'kaede:development': 'Development',
    };
  },
};

// ===================================================================
//  Initialize
// ===================================================================

console.log('[KAEDE] Initializing v%s', KAEDE.version);

TrelloPowerUp.initialize(capabilities)
  .then(function () {
    var el = document.getElementById('status');
    if (el) el.textContent = 'KAEDE ready.';
  })
  .catch(function (err) {
    console.error('[KAEDE] Initialization failed:', err);
    var el = document.getElementById('status');
    if (el) el.textContent = 'Initialization failed.';
  });
