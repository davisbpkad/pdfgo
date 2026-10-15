/**
 * protect.test.mjs - Unit tests for Protect PDF feature
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument as CantooDoc } from '@cantoo/pdf-lib';
import { PDFDocument as StandardDoc } from 'pdf-lib';
import { encryptPdf } from '../../src/features/protect/logic/encryptPdf.js';

test('protect: successfully encrypts PDF and standard pdf-lib rejects without password', async () => {
  // 1. Create a 2-page unencrypted PDF
  const plainDoc = await StandardDoc.create();
  plainDoc.addPage([200, 200]);
  plainDoc.addPage([200, 200]);
  const plainBytes = await plainDoc.save();

  // 2. Encrypt it with encryptPdf
  const result = await encryptPdf(plainBytes, {
    userPassword: 'secretPassword123',
    permissions: {
      printing: true,
      copying: false,
      modifying: false
    }
  });

  assert.equal(result.pageCount, 2);
  assert.ok(result.encryptedBytes instanceof Uint8Array);
  assert.ok(result.encryptedBytes.length > 0);

  // 3. Loading with standard pdf-lib without password must fail
  await assert.rejects(
    async () => {
      await StandardDoc.load(result.encryptedBytes);
    },
    (err) => {
      assert.ok(err.message.includes('encrypted'));
      return true;
    }
  );

  // 4. Loading with correct password in CantooDoc must succeed and have same page count
  const unlockedDoc = await CantooDoc.load(result.encryptedBytes, { password: 'secretPassword123' });
  assert.equal(unlockedDoc.getPageCount(), 2);
});

test('protect: loading with wrong password fails', async () => {
  const plainDoc = await StandardDoc.create();
  plainDoc.addPage([100, 100]);
  const plainBytes = await plainDoc.save();

  const result = await encryptPdf(plainBytes, {
    userPassword: 'correctPassword'
  });

  await assert.rejects(
    async () => {
      await CantooDoc.load(result.encryptedBytes, { password: 'wrongPassword' });
    }
  );
});

test('protect: rejects empty buffer or empty password', async () => {
  await assert.rejects(
    async () => {
      await encryptPdf(new Uint8Array(0), { userPassword: 'abc' });
    },
    /kosong/
  );

  const plainDoc = await StandardDoc.create();
  plainDoc.addPage([100, 100]);
  const plainBytes = await plainDoc.save();

  await assert.rejects(
    async () => {
      await encryptPdf(plainBytes, { userPassword: '' });
    },
    /Password tidak boleh kosong/
  );
});
