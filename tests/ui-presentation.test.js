import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('actual app templates and dialogs respect all twelve demo profiles and review states', () => {
  const result = spawnSync(process.execPath, ['--experimental-vm-modules', 'tests/ui-presentation-harness.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
