const testFiles = [
  'test/orchestrator.test.js',
  'test/e2e-orchestrator.test.js',
  'test/prompter.test.js',
  'test/templates.test.js',
  'test/trello-client.test.js',
  'test/mcp-server.test.js',
  'test/kaede-mcp-server.test.js',
  'test/auto-chainer.test.js',
  'test/enforcer.test.js',
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
