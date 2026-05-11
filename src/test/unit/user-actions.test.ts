import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, memoryStorage } from "@/db";
import { collections, favorites, users } from "@/db/schema";
import {
  addFavorite,
  addFavoriteForUser,
  createCollection,
  createEmailUser,
  deleteCollection,
  getCollectionById,
  getFavoriteByRepo,
  getFavoriteByRepoForUser,
  getFavorites,
  getFavoritesByCollectionId,
  getMyCollections,
  getUserByEmail,
  getUserById,
  removeFavorite,
  removeFavoriteByRepoForUser,
  setCollectionVisibility,
  verifyEmailCredentials,
} from "@/server/user.actions";
import { getServerSession } from "next-auth/next";

vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("collection actions", () => {
  beforeEach(() => {
    memoryStorage.users = [];
    memoryStorage.collections = [];
    memoryStorage.favorites = [];
    memoryStorage.searchHistory = [];
    memoryStorage.comments = [];
    process.env.ADMIN_EMAILS = "";
    vi.restoreAllMocks();
  });

  it("creates normalized email users and verifies credentials", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com";

    const user = await createEmailUser({
      email: " Admin@Example.com ",
      password: "correct-password",
      name: " Admin ",
    });

    expect(user.email).toBe("admin@example.com");
    expect(user.name).toBe("Admin");
    expect(user.role).toBe("ADMIN");
    await expect(getUserById(user.id)).resolves.toMatchObject({ id: user.id });
    await expect(getUserByEmail("ADMIN@example.com")).resolves.toMatchObject({ id: user.id });
    await expect(
      verifyEmailCredentials("admin@example.com", "correct-password")
    ).resolves.toMatchObject({
      id: user.id,
    });
    await expect(verifyEmailCredentials("admin@example.com", "wrong-password")).resolves.toBeNull();
  });

  it("upgrades an existing email-only user with a password", async () => {
    const [existing] = await db
      .insert(users)
      .values({ email: "upgrade@example.com", name: "Existing" })
      .returning();

    const upgraded = await createEmailUser({
      email: "upgrade@example.com",
      password: "new-password",
      name: "Updated",
    });

    expect(upgraded.id).toBe(existing.id);
    expect(upgraded.name).toBe("Updated");
    expect(upgraded.passwordHash).toContain(":");
    await expect(
      createEmailUser({ email: "upgrade@example.com", password: "again" })
    ).rejects.toThrow();
  });

  it("can fetch a public collection by id without filtering by owner", async () => {
    const [owner] = await db
      .insert(users)
      .values({ email: "owner@example.com", name: "Owner" })
      .returning();
    const [collection] = await db
      .insert(collections)
      .values({ name: "Public Picks", isPublic: true, userId: owner.id })
      .returning();

    await db
      .insert(favorites)
      .values({
        userId: owner.id,
        collectionId: collection.id,
        repoFullName: "vercel/next.js",
        repoMeta: { description: "The React Framework" },
      })
      .returning();

    await expect(getCollectionById(collection.id)).resolves.toMatchObject({
      id: collection.id,
      isPublic: true,
      userId: owner.id,
    });
    await expect(getFavoritesByCollectionId(collection.id)).resolves.toHaveLength(1);
  });

  it("keeps owner-filtered favorites separate from collection-wide favorites", async () => {
    const [owner] = await db
      .insert(users)
      .values({ email: "owner@example.com", name: "Owner" })
      .returning();
    const [otherUser] = await db
      .insert(users)
      .values({ email: "other@example.com", name: "Other" })
      .returning();
    const [collection] = await db
      .insert(collections)
      .values({ name: "Shared", isPublic: true, userId: owner.id })
      .returning();

    await db
      .insert(favorites)
      .values([
        {
          userId: owner.id,
          collectionId: collection.id,
          repoFullName: "owner/repo",
          repoMeta: {},
        },
        {
          userId: otherUser.id,
          collectionId: collection.id,
          repoFullName: "other/repo",
          repoMeta: {},
        },
      ])
      .returning();

    await expect(getFavorites(owner.id, collection.id)).resolves.toHaveLength(1);
    await expect(getFavoritesByCollectionId(collection.id)).resolves.toHaveLength(2);
  });

  it("allows the owner to toggle collection visibility", async () => {
    const [owner] = await db
      .insert(users)
      .values({ email: "owner@example.com", name: "Owner" })
      .returning();
    const [collection] = await db
      .insert(collections)
      .values({ name: "Private Picks", isPublic: false, userId: owner.id })
      .returning();

    vi.mocked(getServerSession).mockResolvedValue({ user: { id: owner.id } } as never);

    await setCollectionVisibility(collection.id, true);

    await expect(getCollectionById(collection.id)).resolves.toMatchObject({
      id: collection.id,
      isPublic: true,
    });
  });

  it("creates, deletes, adds, and removes favorites for owned collections", async () => {
    const [owner] = await db
      .insert(users)
      .values({ email: "owner@example.com", name: "Owner" })
      .returning();

    const collection = await createCollection(owner.id, "  Useful Tools  ", true);
    expect(collection).toMatchObject({ name: "Useful Tools", isPublic: true, userId: owner.id });

    const favorite = await addFavorite(owner.id, collection.id, "vercel/next.js", {
      description: "Framework",
    });
    await expect(getFavoriteByRepo(owner.id, "vercel/next.js")).resolves.toMatchObject({
      id: favorite.id,
    });
    await expect(addFavorite(owner.id, collection.id, "invalid-name")).rejects.toThrow();

    await removeFavorite(owner.id, favorite.id);
    await expect(getFavoriteByRepo(owner.id, "vercel/next.js")).resolves.toBeNull();

    await deleteCollection(owner.id, collection.id);
    await expect(getCollectionById(collection.id)).resolves.toBeNull();
  });

  it("uses the authenticated user for convenience favorite actions", async () => {
    const [owner] = await db
      .insert(users)
      .values({ email: "owner@example.com", name: "Owner" })
      .returning();
    const [collection] = await db
      .insert(collections)
      .values({ name: "Mine", isPublic: false, userId: owner.id })
      .returning();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: owner.id } } as never);

    await expect(getMyCollections()).resolves.toHaveLength(1);
    const favorite = await addFavoriteForUser(collection.id, "owner/repo");
    await expect(getFavoriteByRepoForUser("owner/repo")).resolves.toMatchObject({
      id: favorite.id,
    });
    await expect(removeFavoriteByRepoForUser("owner/repo")).resolves.toEqual({ success: true });
    await expect(getFavoriteByRepoForUser("owner/repo")).resolves.toBeNull();
  });

  it("returns safe unauthenticated defaults for convenience actions", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    await expect(getMyCollections()).resolves.toEqual([]);
    await expect(getFavoriteByRepoForUser("owner/repo")).resolves.toBeNull();
    await expect(addFavoriteForUser("collection-id", "owner/repo")).rejects.toThrow();
    await expect(removeFavoriteByRepoForUser("owner/repo")).rejects.toThrow();
  });

  it("propagates favorite lookup database failures", async () => {
    vi.spyOn(db, "select").mockImplementationOnce(() => {
      throw new Error("Database unavailable");
    });

    await expect(getFavoriteByRepo("user-id", "owner/repo")).rejects.toThrow(
      "Database unavailable"
    );
  });
});
