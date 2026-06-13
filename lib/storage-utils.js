export function isQuotaError(err) {
  const msg = (err && err.message ? err.message : String(err || '')).toLowerCase();
  return msg.includes('quota') || msg.includes('kquotabytesperitem');
}

export function estimateBytes(obj) {
  try {
    return new TextEncoder().encode(JSON.stringify(obj)).length;
  } catch {
    return Infinity;
  }
}