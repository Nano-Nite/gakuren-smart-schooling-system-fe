export function attendanceQrLink(token, origin = window.location.origin) {
  const url = new URL('/attendance/scan', origin);
  url.searchParams.set('t', token);
  return url.href;
}

export function attendanceLoginReturn(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value, 'https://gakuren.invalid');
    return url.origin === 'https://gakuren.invalid' && url.pathname === '/attendance/scan'
      ? `${url.pathname}${url.search}` : null;
  } catch { return null; }
}
