#!/usr/bin/env bun
/**
 * Native Bun Concurrent Runner — replaces `concurrently` npm dependency.
 * Launches Static App (Vite on :5173) and WebUI Dashboard (Next.js on :3000) concurrently.
 */

console.log('\x1b[36m[STATIC]\x1b[0m Starting Vite Dev Server...');
const staticProc = Bun.spawn(['bun', 'run', '--filter', '@kaede/static', 'dev'], {
  stdout: 'inherit',
  stderr: 'inherit',
});

console.log('\x1b[35m[WEBUI]\x1b[0m  Starting Next.js Dev Server...');
const webuiProc = Bun.spawn(['bun', 'run', '--filter', '@kaede/webui', 'dev'], {
  stdout: 'inherit',
  stderr: 'inherit',
});

const cleanup = () => {
  staticProc.kill();
  webuiProc.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

await Promise.race([staticProc.exited, webuiProc.exited]);
cleanup();
