import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, memoryStorage } from "@/db";
import { collections, favorites, users } from "@/db/schema";
import {
  getCollectionById,
  getFavoriteByRepo,
  getFavorites,
  getFavoritesByCollectionId,
  setCollectionVisibility,
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
    vi.restoreAllMocks();
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

  it("propagates favorite lookup database failures", async () => {
    vi.spyOn(db, "select").mockImplementationOnce(() => {
      throw new Error("Database unavailable");
    });

    await expect(getFavoriteByRepo("user-id", "owner/repo")).rejects.toThrow(
      "Database unavailable"
    );
  });
});
