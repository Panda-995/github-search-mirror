import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getComments, addComment } from "@/server/comment.actions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ repo: string }> }
) {
  const { repo } = await params;
  const decodedRepo = decodeURIComponent(repo);
  const items = await getComments(decodedRepo);
  return NextResponse.json({ comments: items });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repo } = await params;
  const decodedRepo = decodeURIComponent(repo);
  const body = await request.json();

  const comment = await addComment({
    repoFullName: decodedRepo,
    content: body.content,
    rating: body.rating,
    userId: session.user.id,
    parentId: body.parentId,
  });

  return NextResponse.json({ comment });
}
