import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getFavorites, addFavorite, removeFavorite } from "@/server/user.actions";
import { jsonError, readJsonBody } from "@/lib/api-guard";

const FAVORITE_BODY_MAX_BYTES = 16_384;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get("collectionId") ?? undefined;

    const items = await getFavorites(session.user.id, collectionId);
    return NextResponse.json({ favorites: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取收藏失败";
    return NextResponse.json({ error: message, favorites: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readJsonBody<Record<string, unknown>>(request, FAVORITE_BODY_MAX_BYTES);
    const { collectionId, repoFullName, repoMeta } = body;

    if (
      typeof collectionId !== "string" ||
      typeof repoFullName !== "string" ||
      collectionId.length > 100 ||
      !/^[\w.-]+\/[\w.-]+$/.test(repoFullName)
    ) {
      return NextResponse.json(
        { error: "collectionId and repoFullName are required" },
        { status: 400 }
      );
    }

    const favorite = await addFavorite(
      session.user.id,
      collectionId as string,
      repoFullName as string,
      repoMeta as Record<string, unknown> | undefined
    );
    return NextResponse.json({ favorite });
  } catch (error) {
    const { message, status } = jsonError(error, "添加收藏失败");
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await removeFavorite(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "移除收藏失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
