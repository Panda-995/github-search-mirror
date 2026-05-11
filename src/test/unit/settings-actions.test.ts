import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, memoryStorage } from "@/db";
import { users } from "@/db/schema";
import { decryptSecret, isEncryptedSecret } from "@/lib/secret-crypto";
import { getUserSettings, updateUserSettings } from "@/server/settings.actions";
import { getServerSession } from "next-auth/next";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("settings actions", () => {
  beforeEach(() => {
    memoryStorage.users = [];
    memoryStorage.collections = [];
    memoryStorage.favorites = [];
    memoryStorage.searchHistory = [];
    memoryStorage.comments = [];
    vi.clearAllMocks();
  });

  it("keeps stored secrets configured without exposing them", async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: "owner@example.com",
        name: "Owner",
        githubToken: "ghp_old",
        aiConfig: {
          provider: "openai",
          model: "gpt-4o",
          apiEndpoint: "",
          apiKey: "sk-old",
        },
      })
      .returning();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: user.id } } as never);

    await expect(getUserSettings()).resolves.toMatchObject({
      githubToken: "",
      githubTokenConfigured: true,
      aiConfig: {
        apiKey: "",
        apiKeyConfigured: true,
      },
    });

    const result = await updateUserSettings({
      name: "Owner",
      githubToken: "",
      aiConfig: {
        provider: "openai",
        model: "gpt-4o",
        apiEndpoint: "",
        apiKey: "",
      },
    });

    const stored = memoryStorage.users[0];
    const storedAIConfig = stored.aiConfig as { apiKey: string };

    expect(result.githubTokenConfigured).toBe(true);
    expect(result.aiApiKeyConfigured).toBe(true);
    expect(isEncryptedSecret(stored.githubToken as string)).toBe(true);
    expect(isEncryptedSecret(storedAIConfig.apiKey)).toBe(true);
    expect(decryptSecret(stored.githubToken as string)).toBe("ghp_old");
    expect(decryptSecret(storedAIConfig.apiKey)).toBe("sk-old");
  });

  it("clears stored GitHub and AI secrets explicitly", async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: "owner@example.com",
        name: "Owner",
        githubToken: "ghp_old",
        aiConfig: {
          provider: "claude",
          model: "",
          apiEndpoint: "",
          apiKey: "sk-old",
        },
      })
      .returning();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: user.id } } as never);

    const result = await updateUserSettings({
      name: "Owner",
      githubToken: "",
      clearGithubToken: true,
      aiConfig: {
        provider: "claude",
        model: "",
        apiEndpoint: "",
        apiKey: "",
        clearApiKey: true,
      },
    });

    const stored = memoryStorage.users[0];
    const storedAIConfig = stored.aiConfig as { apiKey: string };

    expect(result.githubTokenConfigured).toBe(false);
    expect(result.aiApiKeyConfigured).toBe(false);
    expect(stored.githubToken).toBeNull();
    expect(storedAIConfig.apiKey).toBe("");
  });
});
