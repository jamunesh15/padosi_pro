import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

const timestampTz = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestampTz("email_verified_at"),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestampTz("locked_until"),
  createdAt: timestampTz("created_at").notNull().defaultNow(),
});

export const emailOtps = pgTable(
  "email_otps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestampTz("expires_at").notNull(),
    usedAt: timestampTz("used_at"),
    createdAt: timestampTz("created_at").notNull().defaultNow(),
  },
  (table) => [index("email_otps_user_created_idx").on(table.userId, table.createdAt)],
);

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  businessName: text("business_name"),
  updatedAt: timestampTz("updated_at").notNull().defaultNow(),
});

export const taskCategories = pgTable("task_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => taskCategories.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const userTasks = pgTable(
  "user_tasks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    createdAt: timestampTz("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.taskId] })],
);
