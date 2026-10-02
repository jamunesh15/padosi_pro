import { profiles } from "../../db/schema";
import type { AppDeps } from "../../deps";
import type { ProfileInput } from "./profile.schemas";

export async function saveProfile({ db, now }: AppDeps, userId: string, input: ProfileInput) {
  const values = { ...input, updatedAt: now() };
  await db
    .insert(profiles)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: profiles.userId, set: values });
}
