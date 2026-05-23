export type AssetInputField = 'image_input' | 'video_input';

export interface AssetUrlSecurityIssue {
  field: AssetInputField;
  index: number;
  reason: string;
}

const ASSET_INPUT_FIELDS: AssetInputField[] = ['image_input', 'video_input'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeHostname(hostname: string): string {
  const lower = hostname.toLowerCase().replace(/\.+$/, '');

  if (lower.startsWith('[') && lower.endsWith(']')) {
    return lower.slice(1, -1);
  }

  return lower;
}

function parseIPv4(hostname: string): number[] | undefined {
  const parts = hostname.split('.');

  if (parts.length !== 4) {
    return undefined;
  }

  const octets = parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      return Number.NaN;
    }

    return Number(part);
  });

  return octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    ? octets
    : undefined;
}

function isBlockedIPv4(octets: number[]): boolean {
  const [a, b] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function parseIPv6(hostname: string): number[] | undefined {
  const [left, right, extra] = hostname.split('::');

  if (extra !== undefined) {
    return undefined;
  }

  const parseHextets = (value: string): number[] | undefined => {
    if (!value) {
      return [];
    }

    const parts = value.split(':');
    const parsed: number[] = [];

    for (const part of parts) {
      if (!/^[0-9a-f]{1,4}$/i.test(part)) {
        return undefined;
      }

      parsed.push(Number.parseInt(part, 16));
    }

    return parsed;
  };

  const leftParts = parseHextets(left);
  const rightParts = parseHextets(right ?? '');

  if (!leftParts || !rightParts) {
    return undefined;
  }

  const missingParts = right === undefined ? 0 : 8 - leftParts.length - rightParts.length;
  if (
    missingParts < 0 ||
    (right === undefined && leftParts.length !== 8) ||
    (right !== undefined && missingParts === 0)
  ) {
    return undefined;
  }

  return [...leftParts, ...Array(missingParts).fill(0), ...rightParts];
}

function isBlockedIPv6(hostname: string): boolean {
  const hextets = parseIPv6(hostname);

  if (!hextets) {
    return true;
  }

  const first = hextets[0];
  const isUnspecified = hextets.every((part) => part === 0);
  const isLoopback =
    hextets.slice(0, 7).every((part) => part === 0) && hextets[7] === 1;
  const isUniqueLocal = (first & 0xfe00) === 0xfc00;
  const isLinkLocal = (first & 0xffc0) === 0xfe80;
  const isIPv4Mapped =
    hextets.slice(0, 5).every((part) => part === 0) && hextets[5] === 0xffff;

  if (isIPv4Mapped) {
    return isBlockedIPv4([
      hextets[6] >> 8,
      hextets[6] & 0xff,
      hextets[7] >> 8,
      hextets[7] & 0xff,
    ]);
  }

  return isUnspecified || isLoopback || isUniqueLocal || isLinkLocal;
}

function getUrlSecurityReason(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return 'must be a non-empty URL string';
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return 'must be a valid URL';
  }

  if (url.protocol !== 'https:') {
    return 'must use https';
  }

  if (url.username || url.password) {
    return 'must not include username or password';
  }

  const hostname = normalizeHostname(url.hostname);
  if (!hostname) {
    return 'must include a host';
  }

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return 'must not use localhost';
  }

  const ipv4 = parseIPv4(hostname);
  if (ipv4 && isBlockedIPv4(ipv4)) {
    return 'must not use a private or reserved IP address';
  }

  if (hostname.includes(':') && isBlockedIPv6(hostname)) {
    return 'must not use a private or reserved IP address';
  }

  return undefined;
}

export function validateAssetInputUrls(
  finalOptions: unknown
): AssetUrlSecurityIssue[] {
  if (!isRecord(finalOptions)) {
    return [];
  }

  const issues: AssetUrlSecurityIssue[] = [];

  for (const field of ASSET_INPUT_FIELDS) {
    const value = finalOptions[field];
    if (value === undefined) {
      continue;
    }

    if (!Array.isArray(value)) {
      issues.push({
        field,
        index: 0,
        reason: 'must be an array of URL strings',
      });
      continue;
    }

    value.forEach((item, index) => {
      const reason = getUrlSecurityReason(item);
      if (reason) {
        issues.push({ field, index, reason });
      }
    });
  }

  return issues;
}

export function assertSafeAssetInputUrls(finalOptions: unknown): void {
  const issue = validateAssetInputUrls(finalOptions)[0];

  if (issue) {
    throw new Error(
      `invalid asset URL: ${issue.field}[${issue.index}] ${issue.reason}`
    );
  }
}
