import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getFavorites, addFavorite, removeFavorite } from "@/server/user.actions";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const collectionId = searchParams.get("collectionId") ?? undefined;

  const items = await getFavorites(session.user.id, collectionId);
  return NextResponse.json({ favorites: items });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { collectionId, repoFullName, repoMeta } = body;

  if (!collectionId || !repoFullName) {
    return NextResponse.json(
      { error: "collectionId and repoFullName are required" },
      { status: 400 }
    );
  }

  const favorite = await addFavorite(
    session.user.id,
    collectionId,
    repoFullName,
    repoMeta
  );
  return NextResponse.json({ favorite });
}

export async function DELETE(request: NextRequest) {
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
}
