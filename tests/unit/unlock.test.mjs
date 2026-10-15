/**
 * unlock.test.mjs - Unit tests for Unlock PDF feature
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument as CantooDoc } from '@cantoo/pdf-lib';
import { PDFDocument as StandardDoc } from 'pdf-lib';
import { isPdfEncrypted, removePassword } from '../../src/features/unlock/logic/removePassword.js';

test('unlock: detects encrypted and unencrypted documents correctly', async () => {
  // 1. Create unencrypted PDF
  const plainDoc = await StandardDoc.create();
  plainDoc.addPage([200, 200]);
  const plainBytes = await plainDoc.save();

  const isPlainEncrypted = await isPdfEncrypted(plainBytes);
  assert.equal(isPlainEncrypted, false);

  // 2. Create encrypted PDF
  const encDoc = await CantooDoc.create();
  encDoc.addPage([200, 200]);
  encDoc.encrypt({
    userPassword: 'password123',
    ownerPassword: 'owner123',
    permissions: {}
  });
  const encBytes = await encDoc.save();

  const isEnc = await isPdfEncrypted(encBytes);
  assert.equal(isEnc, true);
});

test('unlock: rejects incorrect password with WRONG_PASSWORD error code', async () => {
  const encDoc = await CantooDoc.create();
  encDoc.addPage([200, 200]);
  encDoc.encrypt({
    userPassword: 'password123',
    ownerPassword: 'owner123',
    permissions: {}
  });
  const encBytes = await encDoc.save();

  await assert.rejects(
    async () => {
      await removePassword(encBytes, 'salah123');
    },
    (err) => {
      assert.equal(err.code, 'WRONG_PASSWORD');
      return true;
    }
  );
});

test('unlock: successfully removes password and allows standard pdf-lib to load without password', async () => {
  const encDoc = await CantooDoc.create();
  encDoc.addPage([300, 400]);
  encDoc.addPage([300, 400]);
  encDoc.encrypt({
    userPassword: 'password123',
    ownerPassword: 'owner123',
    permissions: {}
  });
  const encBytes = await encDoc.save();

  // Unlock with correct password
  const result = await removePassword(encBytes, 'password123');
  assert.equal(result.pageCount, 2);
  assert.equal(result.wasEncrypted, true);
  assert.ok(result.unlockedBytes instanceof Uint8Array);
  assert.ok(result.unlockedBytes.length > 0);

  // Verify standard pdf-lib loads the result without password
  const verifyDoc = await StandardDoc.load(result.unlockedBytes);
  assert.equal(verifyDoc.getPageCount(), 2);
});

test('unlock: unencrypted PDF passes through cleanly', async () => {
  const plainDoc = await StandardDoc.create();
  plainDoc.addPage([100, 100]);
  const plainBytes = await plainDoc.save();

  const result = await removePassword(plainBytes);
  assert.equal(result.pageCount, 1);
  assert.equal(result.wasEncrypted, false);

  const verifyDoc = await StandardDoc.load(result.unlockedBytes);
  assert.equal(verifyDoc.getPageCount(), 1);
});

test('unlock: throws on empty buffer', async () => {
  await assert.rejects(async () => {
    await removePassword(new Uint8Array(0));
  });
});
