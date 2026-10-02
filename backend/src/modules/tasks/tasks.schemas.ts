import { z } from "zod";

export const taskSelectionBody = z.object(
  {
    taskIds: z
      .array(z.string().trim().min(1).max(64), { error: "taskIds must be a list of task ids." })
      .min(1, "Select at least one task.")
      .max(50, "You can select up to 50 tasks.")
      .transform((ids) => [...new Set(ids)]),
  },
  { error: "Request body must be a JSON object." },
);
