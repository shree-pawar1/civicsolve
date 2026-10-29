import argon2 from 'argon2';

// Baseline dummy hash generated with Argon2id for constant-time comparisons when email is not found
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHRmb3JkdW1teQ$s2b68Y3Jt9d2u4k8fL9y4A3V1e5Z7w9X0y2b4c6d8e0';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    return false;
  }
}

/**
 * Runs a dummy verification against a constant hash to maintain response timing consistency
 * when a user email is not found in the database.
 */
export async function dummyVerifyPassword(plaintext: string): Promise<boolean> {
  try {
    await argon2.verify(DUMMY_HASH, plaintext);
  } catch {
    // Ignore error
  }
  return false;
}
