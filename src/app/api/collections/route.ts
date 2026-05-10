import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getCollections, createCollection } from "@/server/user.actions";
import { NextRequest, NextResponse } from "next/server";
import { jsonError, readJsonBody } from "@/lib/api-guard";

const COLLECTION_BODY_MAX_BYTES = 4096;
const COLLECTION_NAME_MAX_LENGTH = 80;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collections = await getCollections(session.user.id);
    return NextResponse.json({ collections });
  } catch {
    return NextResponse.json({ collections: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await readJsonBody<Record<string, unknown>>(req, COLLECTION_BODY_MAX_BYTES);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const collection = await createCollection(
      session.user.id,
      name.slice(0, COLLECTION_NAME_MAX_LENGTH),
      (body.isPublic as boolean) ?? false
    );
    return NextResponse.json({ collection });
  } catch (error) {
    const { message, status } = jsonError(error, "创建收藏夹失败");
    return NextResponse.json({ error: message }, { status });
  }
}
