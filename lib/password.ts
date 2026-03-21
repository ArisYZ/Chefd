import * as Crypto from 'expo-crypto';

const SALT = 'chefd-local-v1';

export async function hashPassword(plain: string): Promise<string> {
  const combined = `${SALT}:${plain}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
}

export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  const h = await hashPassword(plain);
  return h === hash;
}
