import { asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../../db/client";
import { taskCategories, tasks, userTasks } from "../../db/schema";
import type { AppDeps } from "../../deps";
import { AppError } from "../../lib/errors";

export async function listCatalogue(db: Db) {
  const [categoryRows, taskRows] = await Promise.all([
    db.select().from(taskCategories).orderBy(asc(taskCategories.sortOrder)),
    db
      .select({ id: tasks.id, categoryId: tasks.categoryId, name: tasks.name, description: tasks.description })
      .from(tasks)
      .orderBy(asc(tasks.sortOrder)),
  ]);

  return categoryRows.map((category) => ({
    id: category.id,
    name: category.name,
    tasks: taskRows
      .filter((task) => task.categoryId === category.id)
      .map(({ id, name, description }) => ({ id, name, description })),
  }));
}

export function getSelectedTasks(db: Db, userId: string) {
  return db
    .select({
      id: tasks.id,
      name: tasks.name,
      description: tasks.description,
      categoryId: taskCategories.id,
      categoryName: taskCategories.name,
    })
    .from(userTasks)
    .innerJoin(tasks, eq(tasks.id, userTasks.taskId))
    .innerJoin(taskCategories, eq(taskCategories.id, tasks.categoryId))
    .where(eq(userTasks.userId, userId))
    .orderBy(asc(taskCategories.sortOrder), asc(tasks.sortOrder));
}

export async function saveSelectedTasks({ db }: AppDeps, userId: string, taskIds: string[]) {
  const known = await db.select({ id: tasks.id }).from(tasks).where(inArray(tasks.id, taskIds));
  if (known.length !== taskIds.length) {
    const knownIds = new Set(known.map((task) => task.id));
    throw new AppError(400, "UNKNOWN_TASKS", "Some selected tasks are no longer available. Please refresh the list.", {
      unknownTaskIds: taskIds.filter((id) => !knownIds.has(id)),
    });
  }

  await db.transaction(async (tx) => {
    await tx.delete(userTasks).where(eq(userTasks.userId, userId));
    await tx.insert(userTasks).values(taskIds.map((taskId) => ({ userId, taskId })));
  });

  return getSelectedTasks(db, userId);
}
