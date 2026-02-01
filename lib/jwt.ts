import 'server-only';

import { SignJWT, jwtVerify } from 'jose';

export type SessionTokenPayload = {
  sub: string; // user id
  phone?: string;
  email?: string;
  roles?: string[];
};

const encoder = new TextEncoder();

function getJwtSecret() {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    throw new Error('AUTH_JWT_SECRET not set');
  }
  return encoder.encode(secret);
}

export async function signSessionToken(
  payload: SessionTokenPayload,
  opts?: { expiresInSeconds?: number }
) {
  const secret = getJwtSecret();
  const expiresInSeconds = opts?.expiresInSeconds ?? 60 * 60 * 24 * 365 * 10; // 10 years (non-expiring)

  const tokenPayload: Record<string, unknown> = { roles: payload.roles };
  if (payload.phone) tokenPayload.phone = payload.phone;
  if (payload.email) tokenPayload.email = payload.email;

  return await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });

  const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
  const phone = typeof (payload as any).phone === 'string' ? (payload as any).phone : undefined;
  const email = typeof (payload as any).email === 'string' ? (payload as any).email : undefined;
  const rolesRaw = (payload as any).roles;
  const roles = Array.isArray(rolesRaw) ? rolesRaw.filter((r) => typeof r === 'string') : undefined;

  if (!sub || (!phone && !email)) {
    throw new Error('Invalid session token');
  }

  return { sub, phone, email, roles };
}




