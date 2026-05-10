import { NextRequest, NextResponse } from "next/server";
import { getGitHubRawUrl } from "@/lib/mirror";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; path: string[] }> }
) {
  try {
    const { owner, repo, path } = await params;
    const searchParams = request.nextUrl.searchParams;
    const branch = searchParams.get("branch") ?? "main";
    const filePath = path.join("/");

    const rawUrl = getGitHubRawUrl(owner, repo, branch, filePath);
const MIRROR_REVALIDATE_SECONDS = 3600;
const MIRROR_STALE_WHILE_REVALIDATE_SECONDS = 86400;

    const upstream = await fetch(rawUrl, {
      headers: { "User-Agent": "GitMirror/1.0" },
      next: { revalidate: MIRROR_REVALIDATE_SECONDS },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `GitHub raw fetch failed: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": `public, max-age=${MIRROR_REVALIDATE_SECONDS}, stale-while-revalidate=${MIRROR_STALE_WHILE_REVALIDATE_SECONDS}`,
        "X-GitMirror-Upstream": rawUrl,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取文件失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
