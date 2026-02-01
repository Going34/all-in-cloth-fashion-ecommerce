import 'server-only';

import crypto from 'crypto';

const ITERATIONS = 210_000;
const KEYLEN = 32;
const DIGEST = 'sha256';

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString('hex');
  return `pbkdf2$${DIGEST}$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const parts = hash.split('$');
    if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const digest = parts[1];
    const iterations = parseInt(parts[2], 10);
    const salt = parts[3];
    const storedHash = parts[4];

    if (isNaN(iterations) || !salt || !storedHash) {
      return false;
    }

    const computedHash = crypto
      .pbkdf2Sync(password, salt, iterations, KEYLEN, digest as crypto.BinaryToTextEncoding)
      .toString('hex');

    return computedHash === storedHash;
  } catch {
    return false;
  }
}




