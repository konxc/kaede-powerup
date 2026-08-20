const testFiles = [
  'packages/kaede/test/orchestrator.test.js',
  'packages/kaede/test/e2e-orchestrator.test.js',
  'packages/kaede/test/prompter.test.js',
  'packages/kaede/test/templates.test.js',
  'packages/kaede/test/trello-client.test.js',
  'packages/kaede/test/mcp-server.test.js',
  'packages/kaede/test/kaede-mcp-server.test.js',
  'packages/kaede/test/auto-chainer.test.js',
  'packages/kaede/test/enforcer.test.js',
  'packages/kaede/test/netlify-proxy.test.js',
  'packages/kaede/test/kaede-auth.test.js',
];

let exitCode = 0;

for (const file of testFiles) {
  console.log(`\n── ${file} ──`);
  const result = Bun.spawnSync(['bun', 'test', file], { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' });
  if (result.exitCode !== 0) exitCode = result.exitCode;
}

console.log(`\n${'='.repeat(50)}`);
console.log(exitCode === 0 ? 'All tests passed' : 'Some tests failed');
process.exit(exitCode);
