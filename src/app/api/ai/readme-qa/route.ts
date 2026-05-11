import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { getUserAIConfig } from "@/lib/ai-config";

export async function POST(request: NextRequest) {
  try {
    const { provider, customConfig } = await getUserAIConfig();

    const body = await request.json().catch(() => ({}));
    const { readme, question, repoFullName } = body as {
      readme?: string;
      question?: string;
      repoFullName?: string;
    };

    if (!readme || readme.trim().length === 0) {
      return NextResponse.json({ error: "该项目无 README 内容" }, { status: 400 });
    }

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "请输入您的问题" }, { status: 400 });
    }

    const response = await callAI(
      provider,
      {
        messages: [
          {
            role: "system",
            content:
              "你是一位技术助手，正在帮助用户了解一个 GitHub 项目。" +
              "请根据项目的 README 内容回答用户的问题。" +
              "如果 README 中没有相关信息，请诚实告知，不要编造。" +
              "请用中文回答，简洁清晰。",
          },
          {
            role: "user",
            content: `项目: ${repoFullName || "未知"}\n\nREADME 内容:\n${readme.slice(0, 10000)}\n\n问题: ${question}`,
          },
        ],
        maxTokens: 2048,
      },
      customConfig
    );

    return NextResponse.json({ answer: response.content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 请求失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}