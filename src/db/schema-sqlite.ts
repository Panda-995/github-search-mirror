import {
  integer,
  text,
  sqliteTable,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  githubToken: text("github_token"),
  passwordHash: text("password_hash"),
  email: text("email").unique(),
  name: text("name"),
  avatar: text("avatar"),
  role: text("role", { enum: ["USER", "ADMIN"] }).default("USER"),
  aiConfig: text("ai_config", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const collections = sqliteTable("collections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  repoFullName: text("repo_full_name").notNull(),
  repoMeta: text("repo_meta", { mode: "json" }),
  note: text("note"),
  collectionId: text("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const searchHistory = sqliteTable("search_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  query: text("query").notNull(),
  filters: text("filters", { mode: "json" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
