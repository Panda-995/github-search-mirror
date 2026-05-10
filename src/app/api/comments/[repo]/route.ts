import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { addComment, getComments } from "@/server/comment.actions";
import { jsonError, readJsonBody } from "@/lib/api-guard";
import { authOptions } from "@/lib/auth";

const COMMENT_BODY_MAX_BYTES = 8192;
const COMMENT_MAX_LENGTH = 2000;

function isDatabaseError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("database unavailable") ||
    normalized.includes("database initialization failed") ||
    normalized.includes("database update failed") ||
    normalized.includes("database_url") ||
    normalized.includes("econnrefused") ||
    normalized.includes("failed query") ||
    normalized.includes("relation") ||
    normalized.includes("column") ||
    normalized.includes("does not exist") ||
    normalized.includes("permission denied") ||
    normalized.includes("connection") ||
    normalized.includes("connect") ||
    normalized.includes("timeout")
  );
}

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function commentsUnavailable() {
  return NextResponse.json(
    {
      error: "评论服务暂时不可用",
      comments: [],
    },
    { status: 503 }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repo: string }> }
) {
  try {
    const { repo } = await params;
    const decodedRepo = decodeURIComponent(repo);
    const items = await getComments(decodedRepo);
    return NextResponse.json({ comments: items });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    if (rawMessage === "Invalid repository name") {
      return apiError("仓库名称格式无效", 400);
    }
    if (isDatabaseError(rawMessage)) {
      return commentsUnavailable();
    }
    return NextResponse.json(
      {
        error: "加载评论失败",
        comments: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError("请先登录", 401);
    }

    const { repo } = await params;
    const decodedRepo = decodeURIComponent(repo);
    const body = await readJsonBody<Record<string, unknown>>(request, COMMENT_BODY_MAX_BYTES);
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return apiError("评论内容不能为空", 400);
    }
    if (content.length > COMMENT_MAX_LENGTH) {
      return apiError("评论内容过长", 413);
    }

    const comment = await addComment({
      repoFullName: decodedRepo,
      content,
      rating: typeof body.rating === "number" ? Math.min(Math.max(body.rating, 1), 5) : undefined,
      userId: session.user.id,
      parentId: typeof body.parentId === "string" ? body.parentId : undefined,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    const { message, status } = jsonError(error, "发表评论失败");
    if (message === "Invalid repository name" || message === "Invalid comment content") {
      return apiError(
        message === "Invalid repository name" ? "仓库名称格式无效" : "评论内容无效",
        400
      );
    }
    if (isDatabaseError(message)) {
      return apiError("评论服务暂时不可用", 503);
    }
    return apiError(message, status);
  }
}
