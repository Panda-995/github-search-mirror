import { getRepoContents } from "@/lib/github";
import { getCurrentGitHubToken } from "@/server/github-token";
import { NextRequest, NextResponse } from "next/server";

const REPO_NAME_RE = /^[\w.-]+$/;
const MAX_PATH_LENGTH = 500;

function isSafeRepoPart(value: string) {
  return REPO_NAME_RE.test(value);
}

function normalizePath(value: string | null) {
  const path = (value ?? "").replace(/^\/+/, "").trim();
  if (path.length > MAX_PATH_LENGTH || path.split("/").some((part) => part === "..")) {
    return null;
  }
  return path;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const { owner, repo } = await params;
    if (!isSafeRepoPart(owner) || !isSafeRepoPart(repo)) {
      return NextResponse.json({ error: "Invalid repository path" }, { status: 400 });
    }

    const path = normalizePath(request.nextUrl.searchParams.get("path"));
    if (path === null) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const items = await getRepoContents(owner, repo, path, await getCurrentGitHubToken());
    return NextResponse.json({
      path,
      items: items.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        sha: item.sha,
        html_url: item.html_url,
        download_url: item.download_url,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load repository contents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
