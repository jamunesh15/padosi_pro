import { count, eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import { profiles, users, userTasks } from "../../db/schema";
import { AppError } from "../../lib/errors";

export async function getAccount(db: Db, userId: string) {
  const [[row], [tasks]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        profile: {
          name: profiles.name,
          mobile: profiles.mobile,
          addressLine1: profiles.addressLine1,
          addressLine2: profiles.addressLine2,
          city: profiles.city,
          state: profiles.state,
          pincode: profiles.pincode,
          businessName: profiles.businessName,
        },
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId)),
    db.select({ total: count() }).from(userTasks).where(eq(userTasks.userId, userId)),
  ]);

  if (!row) throw new AppError(401, "SESSION_EXPIRED", "Your session has expired. Please log in again.");

  return {
    id: row.id,
    email: row.email,
    profileCompleted: row.profile !== null,
    profile: row.profile,
    selectedTaskCount: tasks.total,
  };
}
