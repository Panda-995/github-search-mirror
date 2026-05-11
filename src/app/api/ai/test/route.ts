import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { getUserAIConfig } from "@/lib/ai-config";

export async function POST(request: NextRequest) {
  try {
    const { provider, customConfig } = await getUserAIConfig();

    if (!customConfig.apiKey) {
      return NextResponse.json(
        { ok: false, error: "请先配置 API Key" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { provider: testProvider, model, apiKey, apiEndpoint } = body as {
      provider?: string;
      model?: string;
      apiKey?: string;
      apiEndpoint?: string;
    };

    const config = {
      provider: (testProvider || provider) as any,
      model: model || customConfig.model,
      apiKey: apiKey || customConfig.apiKey,
      apiEndpoint: apiEndpoint || customConfig.apiEndpoint,
    };

    const startTime = Date.now();

    const response = await callAI(
      config.provider,
      {
        messages: [
          {
            role: "user",
            content: "Hi, just testing the connection. Reply with 'OK' if you can hear me.",
          },
        ],
        maxTokens: 50,
        temperature: 0,
      },
      config
    );

    const latency = Date.now() - startTime;

    const isOk = response.content.includes("OK") || response.content.length > 0;

    return NextResponse.json({
      ok: isOk,
      model: config.model,
      provider: config.provider,
      latency: `${latency}ms`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "测试失败";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}