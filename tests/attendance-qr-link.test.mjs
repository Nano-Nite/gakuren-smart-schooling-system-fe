import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceQrLink, attendanceLoginReturn } from '../src/utils/attendanceQrLink.js';

test('attendance QR opens the scan page and preserves the exact token for the existing scanner', () => {
  const token = 'signed+token/with?special=&characters';
  const url = new URL(attendanceQrLink(token, 'https://school.example'));
  assert.equal(url.origin, 'https://school.example');
  assert.equal(url.pathname, '/attendance/scan');
  assert.equal(url.searchParams.get('t'), token);
});

test('login return keeps attendance links but rejects external and unrelated destinations', () => {
  assert.equal(attendanceLoginReturn('/attendance/scan?t=abc%2B123'), '/attendance/scan?t=abc%2B123');
  for (const value of [undefined, '//evil.example/attendance/scan', 'https://evil.example/attendance/scan', '/dashboard', '/attendance/scan/other']) {
    assert.equal(attendanceLoginReturn(value), null);
  }
});
