import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

async function tableExists(table: string) {
  const result = await client.execute(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '${table}'`);
  return result.rows.length > 0;
}

async function columnsOf(table: string): Promise<Set<string>> {
  const result = await client.execute(`PRAGMA table_info(${table})`);
  return new Set(result.rows.map((row) => String(row.name)));
}

/**
 * Bring a table that predates the current `src/db/schema.ts` up to date.
 * Legacy columns are renamed so existing rows survive, and anything still
 * missing is added. Safe to run repeatedly, and a no-op on a fresh database
 * because `convergeColumns` returns early when the table does not exist yet.
 */
async function convergeColumns(
  table: string,
  columns: Array<[string, string]>,
  renames: Array<[string, string]> = [],
) {
  if (!(await tableExists(table))) return;

  const existing = await columnsOf(table);

  for (const [from, to] of renames) {
    if (existing.has(to) || !existing.has(from)) continue;
    await client.execute(`ALTER TABLE ${table} RENAME COLUMN ${from} TO ${to}`);
    existing.delete(from);
    existing.add(to);
  }

  for (const [name, definition] of columns) {
    if (existing.has(name)) continue;
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
}

// Must match `src/db/schema.ts`. These bodies only apply to fresh databases --
// `CREATE TABLE IF NOT EXISTS` silently leaves an existing table untouched, which
// is what `convergeColumns` below is for.
const tableStatements = [
  `CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    emailVerified INTEGER,
    image TEXT,
    github_username TEXT,
    role TEXT DEFAULT 'developer',
    created_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS account (
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    PRIMARY KEY (provider, providerAccountId)
  );`,
  `CREATE TABLE IF NOT EXISTS session (
    sessionToken TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    expires INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS verificationToken (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires INTEGER NOT NULL,
    PRIMARY KEY (identifier, token)
  );`,
  `CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    github_org TEXT,
    description TEXT,
    created_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'developer',
    github_username TEXT,
    assigned_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    github_repo TEXT,
    trello_board_id TEXT,
    playbook_path TEXT DEFAULT '.opencode/docs/playbook-template.md',
    openkb_path TEXT DEFAULT '.openkb',
    created_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    operator_github_id TEXT NOT NULL,
    operator_organization_id TEXT,
    source_type TEXT NOT NULL DEFAULT 'personal',
    source_github_id TEXT,
    source_github_login TEXT,
    source_status TEXT NOT NULL DEFAULT 'pending',
    created_by_github_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS workspace_members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
    github_user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    invited_by_github_id TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE (workspace_id, github_user_id)
  );`,
  `CREATE TABLE IF NOT EXISTS source_authorizations (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_github_id TEXT,
    source_github_login TEXT,
    installation_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by_github_id TEXT,
    approved_at INTEGER,
    revoked_at INTEGER,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS workspace_installations (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    installation_id TEXT NOT NULL,
    account_login TEXT NOT NULL,
    account_type TEXT NOT NULL,
    connected_at INTEGER NOT NULL,
    PRIMARY KEY (workspace_id, installation_id)
  );`,
  `CREATE TABLE IF NOT EXISTS workspace_repositories (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_id TEXT NOT NULL,
    installation_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    is_private INTEGER NOT NULL,
    default_branch TEXT,
    source_type TEXT NOT NULL,
    content_path TEXT NOT NULL,
    PRIMARY KEY (workspace_id, repository_id)
  );`,
  `CREATE TABLE IF NOT EXISTS workspace_projects (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    repository_id TEXT NOT NULL,
    installation_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'candidate',
    source_kinds TEXT NOT NULL DEFAULT 'project',
    openkb_path TEXT,
    default_branch TEXT,
    priority_score INTEGER NOT NULL DEFAULT 0,
    discovered_at INTEGER NOT NULL,
    approved_at INTEGER,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS workspace_context_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
    source_kind TEXT NOT NULL,
    path TEXT NOT NULL,
    ref TEXT,
    commit_sha TEXT,
    content TEXT NOT NULL,
    retrieved_at INTEGER NOT NULL,
    UNIQUE (project_id, path)
  );`,
  `CREATE TABLE IF NOT EXISTS workspace_index_runs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    ref TEXT,
    commit_sha TEXT,
    generation TEXT,
    error TEXT,
    requested_at INTEGER NOT NULL,
    finished_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percent',
    discount_value INTEGER NOT NULL DEFAULT 20,
    max_uses INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    expires_at INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS billing_transactions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL,
    gateway_transaction_id TEXT,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'IDR',
    payment_type TEXT DEFAULT 'qris',
    status TEXT NOT NULL DEFAULT 'pending',
    item_type TEXT NOT NULL DEFAULT 'subscription',
    coupon_code TEXT,
    created_at INTEGER NOT NULL,
    settled_at INTEGER
  );`,
  `CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id TEXT PRIMARY KEY,
    affiliate_user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    referred_user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    transaction_id TEXT REFERENCES billing_transactions(id),
    commission_amount INTEGER NOT NULL DEFAULT 0,
    commission_rate INTEGER NOT NULL DEFAULT 20,
    status TEXT NOT NULL DEFAULT 'pending',
    paid_at INTEGER,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS agent_containers (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL DEFAULT 'hermes-whatsapp',
    docker_container_id TEXT,
    docker_host_server TEXT DEFAULT 'srv1.konxc.space',
    assigned_port INTEGER,
    status TEXT NOT NULL DEFAULT 'provisioning',
    whatsapp_connected INTEGER DEFAULT 0,
    whatsapp_qr_code TEXT,
    allocated_cpu TEXT DEFAULT '1.0',
    allocated_ram TEXT DEFAULT '1GB',
    is_manual_provisioned INTEGER DEFAULT 0,
    provisioned_by_admin_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
];

// Run after `convergeColumns`: an index cannot reference a column that is still missing.
const indexStatements = [
  `CREATE INDEX IF NOT EXISTS workspaces_operator_idx ON workspaces(operator_github_id);`,
  `CREATE INDEX IF NOT EXISTS workspaces_source_idx ON workspaces(source_type, source_github_id);`,
  `CREATE INDEX IF NOT EXISTS workspace_members_workspace_idx ON workspace_members(workspace_id);`,
  `CREATE INDEX IF NOT EXISTS workspace_members_user_idx ON workspace_members(user_id);`,
  `CREATE INDEX IF NOT EXISTS source_authorizations_workspace_idx ON source_authorizations(workspace_id);`,
  `CREATE INDEX IF NOT EXISTS source_authorizations_installation_idx ON source_authorizations(installation_id);`,
  `CREATE INDEX IF NOT EXISTS workspace_installations_id_idx ON workspace_installations(installation_id);`,
  `CREATE INDEX IF NOT EXISTS workspace_projects_repo_idx ON workspace_projects(workspace_id, repository_id);`,
  `CREATE INDEX IF NOT EXISTS workspace_projects_status_idx ON workspace_projects(workspace_id, status);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS workspace_projects_workspace_repo_unique ON workspace_projects(workspace_id, repository_id);`,
  `CREATE INDEX IF NOT EXISTS workspace_context_documents_project_idx ON workspace_context_documents(project_id);`,
  `CREATE INDEX IF NOT EXISTS workspace_index_runs_project_idx ON workspace_index_runs(project_id);`,
  `CREATE INDEX IF NOT EXISTS billing_transactions_user_idx ON billing_transactions(user_id);`,
  `CREATE INDEX IF NOT EXISTS billing_transactions_workspace_idx ON billing_transactions(workspace_id);`,
  `CREATE INDEX IF NOT EXISTS affiliate_commissions_affiliate_idx ON affiliate_commissions(affiliate_user_id);`,
  `CREATE INDEX IF NOT EXISTS agent_containers_workspace_idx ON agent_containers(workspace_id);`,
  `CREATE INDEX IF NOT EXISTS agent_containers_user_idx ON agent_containers(user_id);`,
];

async function migrate() {
  console.log('Pushing schema to Turso DB:', url);

  for (const sql of tableStatements) {
    await client.execute(sql);
  }

  await convergeColumns(
    'workspaces',
    [
      ['operator_github_id', "TEXT NOT NULL DEFAULT ''"],
      ['created_by_github_id', 'TEXT'],
      ['operator_organization_id', 'TEXT'],
      ['source_type', "TEXT NOT NULL DEFAULT 'personal'"],
      ['source_github_id', 'TEXT'],
      ['source_github_login', 'TEXT'],
      ['source_status', "TEXT NOT NULL DEFAULT 'pending'"],
    ],
    [
      ['target_type', 'source_type'],
      ['target_github_id', 'source_github_id'],
      ['target_github_login', 'source_github_login'],
      ['status', 'source_status'],
    ],
  );

  await convergeColumns('workspace_members', [['user_id', 'TEXT']]);

  await convergeColumns(
    'source_authorizations',
    [
      ['source_type', "TEXT NOT NULL DEFAULT ''"],
      ['source_github_id', 'TEXT'],
      ['source_github_login', 'TEXT'],
      ['status', "TEXT NOT NULL DEFAULT 'pending'"],
      ['approved_by_github_id', 'TEXT'],
      ['approved_at', 'INTEGER'],
      ['revoked_at', 'INTEGER'],
    ],
    [
      ['target_type', 'source_type'],
      ['target_github_id', 'source_github_id'],
      ['target_github_login', 'source_github_login'],
    ],
  );

  // `operator_github_id`/`created_by_github_id` replace the retired
  // `owner_github_id`. Only pre-migration databases still carry that column,
  // and a fresh database has no rows to backfill.
  const workspaceColumns = await columnsOf('workspaces');
  if (workspaceColumns.has('owner_github_id')) {
    if (workspaceColumns.has('operator_github_id')) {
      await client.execute(
        `UPDATE workspaces
            SET operator_github_id = COALESCE(NULLIF(operator_github_id, ''), owner_github_id, created_by_github_id)
          WHERE operator_github_id IS NULL OR operator_github_id = '';`,
      );
    }
    if (workspaceColumns.has('created_by_github_id')) {
      await client.execute(
        'UPDATE workspaces SET created_by_github_id = COALESCE(created_by_github_id, owner_github_id) WHERE created_by_github_id IS NULL;',
      );
    }
  }

  for (const sql of indexStatements) {
    await client.execute(sql);
  }

  console.log('✅ Turso DB schema migration complete!');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
