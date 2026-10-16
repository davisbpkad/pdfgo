/**
 * aiSummaryLoadOrder.test.mjs - Regression test: a slow extraction must not
 * overwrite the document the user loaded afterwards.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { useAiSummary } from '../../src/features/ai-summary/logic/useAiSummary.js';

const fakeFile = (name, delay) => ({ name, delay, arrayBuffer: async () => new ArrayBuffer(8) });

test('ai-summary: the newest document wins when two loads overlap', async () => {
  const loadText = async (file) => {
    await new Promise((resolve) => setTimeout(resolve, file.delay));
    return { fullText: `teks ${file.name}` };
  };
  const summary = useAiSummary({ loadText });

  const slow = summary.loadDocument(fakeFile('dokumen-A.pdf', 60));
  const fast = summary.loadDocument(fakeFile('dokumen-B.pdf', 5));
  await Promise.all([slow, fast]);

  assert.equal(summary.activeFile.value.name, 'dokumen-B.pdf');
  assert.equal(summary.extractedText.value, 'teks dokumen-B.pdf');
  assert.equal(summary.isExtracting.value, false);
});

test('ai-summary: a single load still fills the text', async () => {
  const loadText = async (file) => ({ fullText: `teks ${file.name}` });
  const summary = useAiSummary({ loadText });

  await summary.loadDocument(fakeFile('satu.pdf', 0));

  assert.equal(summary.extractedText.value, 'teks satu.pdf');
  assert.equal(summary.isExtracting.value, false);
});
