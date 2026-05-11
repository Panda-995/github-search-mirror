import * as pgSchema from "./schema-pg";
import * as sqliteSchema from "./schema-sqlite";

const isSqlite = process.env.DATABASE_PROVIDER === "sqlite";

export const users = isSqlite ? sqliteSchema.users : pgSchema.users;
export const collections = isSqlite ? sqliteSchema.collections : pgSchema.collections;
export const favorites = isSqlite ? sqliteSchema.favorites : pgSchema.favorites;
export const searchHistory = isSqlite ? sqliteSchema.searchHistory : pgSchema.searchHistory;
