import dns from 'node:dns/promises';
import net from 'node:net';
import { ApiError } from './ApiError.js';

// Reject non-http(s) schemes and any URL that resolves to a private/loopback/link-local address.
// ponytail: DNS-resolve + range check covers the common SSRF cases; a determined attacker via
// TOCTOU/redirect is out of scope for a free audit tool — upgrade to a fetch-time pinned agent if it matters.
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) || // link-local
      a === 0
    );
  }
  const lower = ip.toLowerCase();
  return (
    lower === '::1' || // loopback
    lower.startsWith('fe80') || // link-local
    lower.startsWith('fc') || // unique local
    lower.startsWith('fd')
  );
}

export async function validateAuditUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ApiError(400, 'Enter a valid website URL (including https://).');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ApiError(400, 'Only http and https URLs can be audited.');
  }

  let addresses;
  try {
    addresses = await dns.lookup(url.hostname, { all: true });
  } catch {
    throw new ApiError(400, "That domain couldn't be found. Check the URL and try again.");
  }

  if (addresses.some(({ address }) => isPrivateIp(address))) {
    throw new ApiError(400, 'That URL points to a private network and cannot be audited.');
  }

  return url.toString();
}
