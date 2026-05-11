import {
  boolean,
  integer,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubToken: text("github_token"),
  passwordHash: text("password_hash"),
  email: varchar("email", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("USER"),
  aiConfig: jsonb("ai_config"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    isPublic: boolean("is_public").default(false),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("collections_user_id_idx").on(table.userId)]
);

export const favorites = pgTable(
  "favorites",
  {
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
  },
  (table) => [
    index("favorites_user_id_idx").on(table.userId),
    index("favorites_collection_id_idx").on(table.collectionId),
  ]
);

export const searchHistory = pgTable(
  "search_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    query: text("query").notNull(),
    filters: jsonb("filters"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("search_history_user_id_idx").on(table.userId)]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repoFullName: varchar("repo_full_name", { length: 255 }).notNull(),
    content: text("content").notNull(),
    rating: integer("rating"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    isPinned: boolean("is_pinned").default(false),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("comments_repo_full_name_idx").on(table.repoFullName)]
);
