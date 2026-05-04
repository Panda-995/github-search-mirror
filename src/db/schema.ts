import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubId: varchar("github_id", { length: 255 }).unique(),
  githubToken: text("github_token"),
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("USER"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  isPublic: boolean("is_public").default(false),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  repoFullName: varchar("repo_full_name", { length: 255 }).notNull(),
  repoMeta: jsonb("repo_meta"),
  note: text("note"),
  collectionId: uuid("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const searchHistory = pgTable("search_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  query: text("query").notNull(),
  filters: jsonb("filters"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const filterPresets = pgTable("filter_presets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  filters: jsonb("filters").notNull(),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  repoFullName: varchar("repo_full_name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  rating: integer("rating"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  isPinned: boolean("is_pinned").default(false),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const hotSearches = pgTable("hot_searches", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyword: varchar("keyword", { length: 255 }).notNull().unique(),
  count: integer("count").default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const pinnedRepos = pgTable("pinned_repos", {
  id: uuid("id").primaryKey().defaultRandom(),
  repoFullName: varchar("repo_full_name", { length: 255 }).notNull().unique(),
  reason: text("reason"),
  position: integer("position").default(0),
  type: varchar("type", { length: 50 }).default("trending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
