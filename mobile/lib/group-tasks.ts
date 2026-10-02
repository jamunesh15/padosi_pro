import type { SelectedTask, TaskCategory } from '@/lib/api/types';

export type TaskGroup = { id: string; name: string; tasks: SelectedTask[] };

// Keeps the server's category order and groups a flat list of tasks under their category.
export function groupByCategory(tasks: SelectedTask[]): TaskGroup[] {
  const groups = new Map<string, TaskGroup>();
  for (const task of tasks) {
    const group = groups.get(task.categoryId) ?? {
      id: task.categoryId,
      name: task.categoryName,
      tasks: [],
    };
    group.tasks.push(task);
    groups.set(task.categoryId, group);
  }
  return [...groups.values()];
}

export function pickFromCatalogue(categories: TaskCategory[], ids: Set<string>): SelectedTask[] {
  return categories.flatMap((category) =>
    category.tasks
      .filter((task) => ids.has(task.id))
      .map((task) => ({ ...task, categoryId: category.id, categoryName: category.name }))
  );
}
