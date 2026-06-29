#!/usr/bin/env bun
/**
 * Deploy documentation to GitHub Pages (gh-pages branch)
 *
 * Manual deploy tanpa CI/CD — push ./dist-docs ke branch gh-pages.
 * Menggunakan git worktree agar tidak merusak working directory.
 *
 * Usage: bun scripts/deploy-gh-pages.mjs
 */

import { execSync } from 'child_process';
import { existsSync, cpSync, rmSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST_DOCS = resolve(ROOT, 'dist-docs');
const WORKTREE = resolve(ROOT, '.worktree-gh-pages');
const DATE = new Date().toISOString().split('T')[0];
const BRANCH = 'gh-pages';

function run(cmd, opts = {}) {
  console.log(`  \x1b[36m  $\x1b[0m ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function capture(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe', ...opts })
    .toString()
    .trim();
}

function hasBranch(name) {
  return capture(`git --no-pager branch`)
    .split('\n')
    .some((b) => b.trim().replace('*', '').trim() === name);
}

async function main() {
  console.log('');
  console.log('  \x1b[35m╔══════════════════════════════════════════╗\x1b[0m');
  console.log('  \x1b[35m║    KAEDE — Deploy GitHub Pages           ║\x1b[0m');
  console.log('  \x1b[35m╚══════════════════════════════════════════╝\x1b[0m');
  console.log('');

  // 1. Build docs
  console.log('  \x1b[36m  Building docs...\x1b[0m');
  run('bun run build:docs');
  if (!existsSync(DIST_DOCS) || readdirSync(DIST_DOCS).length === 0) {
    console.error('  \x1b[31m  ✗ dist-docs/ is empty — build failed?\x1b[0m');
    process.exit(1);
  }

  // 2. Bersihkan worktree lama jika ada
  if (existsSync(WORKTREE)) {
    capture(`git worktree remove --force ${WORKTREE}`, { stdio: 'pipe' });
  }

  try {
    // 3. Buat worktree
    if (hasBranch(BRANCH)) {
      run(`git worktree add --force ${WORKTREE} ${BRANCH}`);
      // Hapus semua file dari worktree (kecuali .git)
      const items = readdirSync(WORKTREE).filter((f) => f !== '.git');
      for (const item of items) {
        rmSync(resolve(WORKTREE, item), { recursive: true, force: true });
      }
    } else {
      run(`git worktree add --detach ${WORKTREE}`);
      capture(`git --git-dir=${WORKTREE}/.git checkout --orphan ${BRANCH}`, { cwd: WORKTREE, stdio: 'pipe' });
    }

    // 4. Copy hasil build ke worktree
    const items = readdirSync(DIST_DOCS);
    for (const item of items) {
      cpSync(resolve(DIST_DOCS, item), resolve(WORKTREE, item), { recursive: true });
    }

    // 5. Commit & push
    capture(`git -C ${WORKTREE} add -A`, { cwd: WORKTREE, stdio: 'pipe' });

    const hasChanges = capture(`git -C ${WORKTREE} status --porcelain`, { cwd: WORKTREE });
    if (!hasChanges) {
      console.log('  \x1b[33m  ⚠  No changes — gh-pages already up to date\x1b[0m');
    } else {
      capture(`git -C ${WORKTREE} commit -m "docs: auto-deploy ${DATE}"`, { cwd: WORKTREE, stdio: 'pipe' });
      run(`git push --force origin ${BRANCH}`);
      console.log('');
      console.log('  \x1b[32m  ✅  Deployed to gh-pages! \x1b[0m');
    }
  } catch (err) {
    console.error(`  \x1b[31m  ✗ Deploy failed: ${err.message}\x1b[0m`);
    process.exit(1);
  } finally {
    // 6. Bersihkan worktree
    if (existsSync(WORKTREE)) {
      try {
        capture(`git worktree remove --force ${WORKTREE}`, { stdio: 'pipe' });
      } catch {}
    }
  }
}

main().catch((err) => {
  console.error('  \x1b[31m  ✗ Fatal:', err.message, '\x1b[0m');
  process.exit(1);
});
