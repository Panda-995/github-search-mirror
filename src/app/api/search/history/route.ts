import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getSearchHistory, clearSearchHistory } from "@/server/history.actions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await getSearchHistory(session.user.id);
    return NextResponse.json({ history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取历史记录失败";
    return NextResponse.json({ error: message, history: [] }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await clearSearchHistory(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "清除历史记录失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
