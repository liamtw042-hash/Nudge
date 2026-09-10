const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Unguessable, URL-safe id. 22 chars from a 57-symbol alphabet is ~128 bits. */
export function token(length = 22): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** Short id for things that are never exposed as a capability. */
export function shortId(): string {
  return token(10);
}
