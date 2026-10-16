/**
 * hexColor.test.mjs - hex color parsing must never produce NaN channels,
 * which pdf-lib would silently accept and render as garbage.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { hexToRgb } from '../../src/features/edit-pdf/logic/hexColor.js';

const BLACK = { type: 'RGB', red: 0, green: 0, blue: 0 };

test('hexColor: parses #rrggbb and #rgb shorthand', () => {
  assert.deepEqual(hexToRgb('#ff0000'), { type: 'RGB', red: 1, green: 0, blue: 0 });
  assert.deepEqual(hexToRgb('#00ff00'), { type: 'RGB', red: 0, green: 1, blue: 0 });
  assert.deepEqual(hexToRgb('#abc'), { type: 'RGB', red: 170 / 255, green: 187 / 255, blue: 204 / 255 });
  assert.deepEqual(hexToRgb('ffffff'), { type: 'RGB', red: 1, green: 1, blue: 1 });
});

test('hexColor: invalid input falls back to black instead of NaN', () => {
  for (const bad of ['#zzzzzz', '#zzz', 'nope', '', null, undefined, 42, {}]) {
    const color = hexToRgb(bad);
    assert.ok(![color.red, color.green, color.blue].some(Number.isNaN), `NaN channel for ${String(bad)}`);
    assert.deepEqual(color, BLACK);
  }
});
