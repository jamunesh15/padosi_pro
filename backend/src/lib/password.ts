import bcrypt from "bcryptjs";

let dummyHash: string | undefined;

export function hashPassword(password: string, rounds: number): Promise<string> {
  return bcrypt.hash(password, rounds);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
export async function burnPasswordCheck(password: string, rounds: number): Promise<void> {
  dummyHash ??= await bcrypt.hash("not-a-real-password", rounds);
  await bcrypt.compare(password, dummyHash);
}
