import { NextRequest, NextResponse } from "next/server";
import { getGitHubRawUrl } from "@/lib/mirror";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string; path: string[] }> }
) {
  const { owner, repo, path } = await params;
  const searchParams = request.nextUrl.searchParams;
  const branch = searchParams.get("branch") ?? "main";
  const filePath = path.join("/");

  const rawUrl = getGitHubRawUrl(owner, repo, branch, filePath);

  return NextResponse.redirect(rawUrl, 302);
}
