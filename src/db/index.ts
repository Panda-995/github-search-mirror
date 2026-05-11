import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: DrizzleDatabase | null = null;
let poolInstance: Pool | null = null;
let commentsSchemaReady: Promise<void> | null = null;
let memoryIdSequence = 0;

type TableRecord = Record<string, unknown>;

interface MemoryStorage {
  users: TableRecord[];
  collections: TableRecord[];
  favorites: TableRecord[];
  searchHistory: TableRecord[];
  comments: TableRecord[];
}

interface FilterCondition {
  left?: unknown;
  right?: unknown;
  conditions?: Array<{ left?: unknown; right?: unknown }>;
}

type AwaitableQuery<T = TableRecord[]> = {
  limit: (n: number) => Promise<T>;
  orderBy: (...args: unknown[]) => AwaitableQuery<T>;
  then: <TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ) => Promise<TResult1 | TResult2>;
};

type DrizzleQueryBuilder = {
  where: (condition: FilterCondition | unknown) => DrizzleQueryBuilder;
  limit: (n: number) => Promise<TableRecord[]>;
  orderBy: (...args: unknown[]) => DrizzleQueryBuilder;
};

export type DB = Pick<DrizzleDatabase, "delete" | "insert" | "select" | "update">;

const memoryStorage: MemoryStorage = {
  users: [],
  collections: [],
  favorites: [],
  searchHistory: [],
  comments: [],
};

function canUseMemoryDb() {
  return process.env.NODE_ENV === "test" || process.env.ALLOW_MEMORY_DB === "true";
}

function getPool() {
  if (poolInstance) return poolInstance;
  if (!process.env.DATABASE_URL) {
    if (canUseMemoryDb()) return null;
    throw new Error("DATABASE_URL is required");
  }

  poolInstance = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return poolInstance;
}

function initDb() {
  if (dbInstance) return dbInstance;
  if (process.env.NODE_ENV === "test" && process.env.USE_POSTGRES_IN_TEST !== "true") {
    return null;
  }

  try {
    const pool = getPool();
    if (!pool) return null;
    dbInstance = drizzle(pool, { schema });
    return dbInstance;
  } catch {
    if (!canUseMemoryDb()) {
      throw new Error("Database initialization failed");
    }
    return null;
  }
}

export async function ensureCommentsSchema() {
  if (canUseMemoryDb()) return;

  const pool = getPool();
  if (!pool) return;

  if (!commentsSchemaReady) {
    commentsSchemaReady = (async () => {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`).catch(() => undefined);

      await pool.query(`
        DO $$
        BEGIN
          CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          github_token text,
          password_hash text,
          email varchar(255) UNIQUE,
          name varchar(255),
          avatar text,
          role user_role DEFAULT 'USER',
          ai_config jsonb,
          created_at timestamp with time zone DEFAULT now()
        );

        ALTER TABLE users ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
        ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token text;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email varchar(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar text;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'USER';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_config jsonb;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
        ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          repo_full_name varchar(255) NOT NULL,
          content text NOT NULL,
          rating integer,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
          is_pinned boolean DEFAULT false,
          is_deleted boolean DEFAULT false,
          created_at timestamp with time zone DEFAULT now()
        );

        ALTER TABLE comments ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS repo_full_name varchar(255);
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS content text;
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS rating integer;
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES comments(id) ON DELETE CASCADE;
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
        ALTER TABLE comments ALTER COLUMN id SET DEFAULT gen_random_uuid();

        UPDATE comments SET is_pinned = false WHERE is_pinned IS NULL;
        UPDATE comments SET is_deleted = false WHERE is_deleted IS NULL;
        UPDATE comments SET created_at = now() WHERE created_at IS NULL;

        CREATE INDEX IF NOT EXISTS comments_repo_full_name_idx ON comments(repo_full_name);
      `);
    })().catch((error) => {
      commentsSchemaReady = null;
      throw error;
    });
  }

  await commentsSchemaReady;
}

export async function checkDatabaseHealth() {
  if (canUseMemoryDb()) {
    return { ok: true, mode: "memory" };
  }

  const pool = getPool();
  if (!pool) {
    return { ok: false, mode: "unavailable" };
  }

  await pool.query("select 1");
  return { ok: true, mode: "postgres" };
}

function getTableName(table: unknown): keyof MemoryStorage {
  if (!table) return "users";
  let name: string | undefined;
  try {
    const t = table as Record<symbol, string>;
    name = t[Symbol.for("drizzle:Name")] || t[Symbol.for("drizzle:BaseName")];
  } catch {
    name = undefined;
  }
  if (name === "users") return "users";
  if (name === "collections") return "collections";
  if (name === "favorites") return "favorites";
  if (name === "search_history") return "searchHistory";
  if (name === "comments") return "comments";
  return "users";
}

function getColumnPropName(column: unknown): string {
  if (!column) return "";
  const col = column as Record<string, unknown>;
  const table = col.table as Record<symbol, Record<string, unknown>> | undefined;
  if (table) {
    const cols = table[Symbol.for("drizzle:Columns")];
    if (cols) {
      for (const [propName, c] of Object.entries(cols)) {
        if (c === column) return propName;
      }
    }
    for (const key of Object.keys(table)) {
      if ((table as Record<string, unknown>)[key] === column) return key;
    }
  }
  return (col.name as string) || "";
}

function getRecordValue(item: TableRecord, propName: string) {
  if (propName in item) return item[propName];
  const camelPropName = propName.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
  return item[camelPropName];
}

function getChunkText(chunk: unknown): string {
  const value = (chunk as { value?: unknown }).value;
  return Array.isArray(value) ? value.join("") : typeof value === "string" ? value : "";
}

function getParamValue(chunk: unknown): unknown {
  if (chunk && typeof chunk === "object" && "value" in chunk) {
    return (chunk as { value: unknown }).value;
  }
  return chunk;
}

function hasQueryChunks(value: unknown): value is { queryChunks: unknown[] } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    Array.isArray((value as { queryChunks?: unknown }).queryChunks)
  );
}

function evaluateSqlCondition(item: TableRecord, condition: unknown): boolean {
  if (!hasQueryChunks(condition)) return true;

  for (let idx = 0; idx < condition.queryChunks.length - 2; idx++) {
    const column = condition.queryChunks[idx];
    const operator = getChunkText(condition.queryChunks[idx + 1]);
    if (!operator.includes("=")) continue;

    const propName = getColumnPropName(column);
    if (!propName) continue;

    return getRecordValue(item, propName) === getParamValue(condition.queryChunks[idx + 2]);
  }

  const childConditions = condition.queryChunks.filter(hasQueryChunks);
  return childConditions.length > 0
    ? childConditions.every((child) => evaluateSqlCondition(item, child))
    : true;
}

function applyCondition(
  items: TableRecord[],
  condition: FilterCondition | undefined
): TableRecord[] {
  if (!condition) return items;
  return items.filter((item) => {
    if (condition.left && condition.right !== undefined) {
      const propName = getColumnPropName(condition.left);
      return getRecordValue(item, propName) === condition.right;
    }
    if (condition.conditions) {
      return condition.conditions.every((c) => {
        const propName = getColumnPropName(c.left);
        return getRecordValue(item, propName) === c.right;
      });
    }
    return evaluateSqlCondition(item, condition);
  });
}

function sortByCreatedAt(items: TableRecord[]) {
  return [...items].sort(
    (a, b) =>
      new Date((b.createdAt as string) || 0).getTime() -
      new Date((a.createdAt as string) || 0).getTime()
  );
}

function makeAwaitable<T = TableRecord[]>(limitFn: (n: number) => Promise<T>): AwaitableQuery<T> {
  const query: AwaitableQuery<T> = {
    limit: limitFn,
    orderBy: () => makeAwaitable(limitFn),
    then: (onFulfilled, onRejected) => limitFn(1000).then(onFulfilled, onRejected),
  };
  return query;
}

function memQuery(tableName: keyof MemoryStorage): AwaitableQuery {
  const items = memoryStorage[tableName];

  return {
    limit: (n: number) => Promise.resolve(items.slice(0, n)),
    orderBy: () => makeAwaitable((n) => Promise.resolve(sortByCreatedAt(items).slice(0, n))),
    then: (onFulfilled, onRejected) =>
      Promise.resolve(items.slice(0, 1000)).then(onFulfilled, onRejected),
  };
}

function memSelect() {
  return {
    from: (table: unknown) => {
      const tableName = getTableName(table);
      const base = memQuery(tableName);
      return {
        ...base,
        where: (condition: FilterCondition) => {
          const filtered = applyCondition([...memoryStorage[tableName]], condition);
          return makeAwaitable((n) => Promise.resolve(filtered.slice(0, n)));
        },
      };
    },
  };
}

function memInsert(table: unknown) {
  return {
    values: (data: TableRecord | TableRecord[]) => ({
      returning: () => {
        const tableName = getTableName(table);
        const items = Array.isArray(data) ? data : [data];
        const results = items.map((item, idx) => {
          const record = {
            ...item,
            id: item.id ?? `mem-${Date.now()}-${memoryIdSequence++}-${idx}`,
            createdAt: item.createdAt ?? new Date(),
            updatedAt: item.updatedAt ?? new Date(),
          };
          memoryStorage[tableName].push(record);
          return record;
        });
        return Promise.resolve(results);
      },
    }),
  };
}

function memDelete(table: unknown) {
  return {
    where: (condition: FilterCondition) => {
      const tableName = getTableName(table);
      const toDelete = new Set(
        applyCondition(memoryStorage[tableName], condition).map((item) => item.id)
      );
      memoryStorage[tableName] = memoryStorage[tableName].filter((item) => !toDelete.has(item.id));
      return Promise.resolve();
    },
  };
}

function memUpdate(table: unknown) {
  return {
    set: (data: TableRecord) => ({
      where: (condition: FilterCondition) => {
        const tableName = getTableName(table);
        const itemsToUpdate = new Set(
          applyCondition(memoryStorage[tableName], condition).map((item) => item.id)
        );
        memoryStorage[tableName] = memoryStorage[tableName].map((item) =>
          itemsToUpdate.has(item.id) ? { ...item, ...data } : item
        );
        return Promise.resolve();
      },
    }),
  };
}

function wrapQuery(
  realQuery: DrizzleQueryBuilder,
  table: unknown
): AwaitableQuery & {
  where: (condition: FilterCondition | unknown) => AwaitableQuery;
} {
  const tableName = getTableName(table);
  const fallback = memQuery(tableName);
  const run = async (query: DrizzleQueryBuilder, n: number) => {
    try {
      return await query.limit(n);
    } catch (error) {
      if (!canUseMemoryDb()) throw error;
      return fallback.limit(n);
    }
  };

  return {
    limit: (n: number) => run(realQuery, n),
    orderBy: (...args: unknown[]) => makeAwaitable((n) => run(realQuery.orderBy(...args), n)),
    where: (condition: FilterCondition | unknown) => {
      const filtered = applyCondition([...memoryStorage[tableName]], condition as FilterCondition);
      const memory = makeAwaitable((n) => Promise.resolve(filtered.slice(0, n)));
      return {
        limit: async (n: number) => {
          try {
            return await realQuery.where(condition).limit(n);
          } catch (error) {
            if (!canUseMemoryDb()) throw error;
            return memory.limit(n);
          }
        },
        orderBy: (...args: unknown[]) =>
          makeAwaitable(async (n) => {
            try {
              return await realQuery
                .where(condition)
                .orderBy(...args)
                .limit(n);
            } catch (error) {
              if (!canUseMemoryDb()) throw error;
              return memory.orderBy(...args).limit(n);
            }
          }),
        then: (onFulfilled, onRejected) => memory.then(onFulfilled, onRejected),
      };
    },
    then: (onFulfilled, onRejected) => run(realQuery, 1000).then(onFulfilled, onRejected),
  };
}

export const db: DB = {
  insert: (table: unknown) => ({
    values: (data: TableRecord | TableRecord[]) => ({
      returning: async (columns?: unknown) => {
        const realDb = initDb();
        if (realDb) {
          try {
            const query = realDb.insert(table as never).values(data as never);
            const result = columns
              ? await query.returning(columns as never)
              : await query.returning();
            return result as TableRecord[];
          } catch (error) {
            if (!canUseMemoryDb()) throw error;
          }
        }
        if (!canUseMemoryDb()) {
          throw new Error("Database unavailable");
        }
        return memInsert(table).values(data).returning();
      },
    }),
  }),

  select: () => ({
    from: (table: unknown) => {
      const realDb = initDb();
      if (realDb) {
        try {
          return wrapQuery(
            realDb.select().from(table as never) as unknown as DrizzleQueryBuilder,
            table
          );
        } catch (error) {
          if (!canUseMemoryDb()) throw error;
        }
      }
      if (!canUseMemoryDb()) {
        throw new Error("Database unavailable");
      }
      return memSelect().from(table);
    },
  }),

  delete: (table: unknown) => ({
    where: async (condition: FilterCondition) => {
      const realDb = initDb();
      if (realDb) {
        try {
          await realDb.delete(table as never).where(condition as never);
          return;
        } catch (error) {
          if (!canUseMemoryDb()) throw error;
        }
      }
      if (!canUseMemoryDb()) {
        throw new Error("Database unavailable");
      }
      await memDelete(table).where(condition);
    },
  }),

  update: (table: unknown) => ({
    set: (data: TableRecord) => ({
      where: async (condition: FilterCondition) => {
        const realDb = initDb();
        if (realDb) {
          try {
            await realDb
              .update(table as never)
              .set(data as never)
              .where(condition as never);
            return;
          } catch (error) {
            if (!canUseMemoryDb()) {
              const message = error instanceof Error ? error.message : String(error);
              throw new Error("Database update failed: " + message);
            }
          }
        }
        if (!canUseMemoryDb()) {
          throw new Error("Database unavailable");
        }
        await memUpdate(table).set(data).where(condition);
      },
    }),
  }),
} as unknown as DB;

export { memoryStorage };
