import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { getUserAIConfig } from "@/lib/ai-config";

export async function POST(request: NextRequest) {
  try {
    const { provider, customConfig } = await getUserAIConfig();

    const body = await request.json().catch(() => ({}));
    const { repos, query } = body as {
      repos?: { full_name: string; name: string; owner: string; description: string | null; stars: number; language: string | null }[];
      query?: string;
    };

    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json({ error: "请提供项目列表" }, { status: 400 });
    }

    const repoList = repos.slice(0, 20).map((repo, index) =>
      `${index + 1}. ${repo.full_name} — ${repo.description || "无描述"} (${repo.stars} stars, ${repo.language || "未知语言"})`
    ).join("\n");

    const searchContext = query ? `搜索关键词: "${query}"` : "";

    const response = await callAI(
      provider,
      {
        messages: [
          {
            role: "system",
            content:
              "你是一位技术选型专家。请根据以下搜索结果，给出仓库选型建议。" +
              "要求：\n" +
              "1) 从列表中推荐 1-3 个最值得关注的项目，简述理由\n" +
              "2) 分析这些项目的适用场景\n" +
              "3) 给出选型关注要点（如社区活跃度、文档质量、维护状态）\n" +
              "请用中文回答，格式为 Markdown，简洁专业。",
          },
          {
            role: "user",
            content: `${searchContext}\n\n搜索结果:\n${repoList}\n\n请给出选型建议。`,
          },
        ],
        maxTokens: 2048,
      },
      customConfig
    );

    return NextResponse.json({ recommendation: response.content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 请求失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}