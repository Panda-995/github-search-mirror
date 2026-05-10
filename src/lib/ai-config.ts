import { getUserSettings } from "@/server/settings.actions";
import type { AIProvider, AICustomConfig } from "./ai";
import { assertSafeAIEndpoint, parseAIProvider } from "./ai-safety";

export async function getUserAIConfig(): Promise<{
  provider: AIProvider;
  customConfig?: AICustomConfig;
}> {
  const userSettings = await getUserSettings();
  const aiConfig = userSettings?.aiConfig;

  const provider = parseAIProvider(aiConfig?.provider);
  const customConfig: AICustomConfig | undefined = aiConfig?.apiKey
    ? {
        provider,
        model: aiConfig.model || undefined,
        apiEndpoint: aiConfig.apiEndpoint ? assertSafeAIEndpoint(aiConfig.apiEndpoint) : undefined,
        apiKey: aiConfig.apiKey || undefined,
      }
    : undefined;

  return { provider, customConfig };
}
