import { getRepoFileContent } from "@/lib/github";
import { getCurrentGitHubToken } from "@/server/github-token";
import { NextRequest, NextResponse } from "next/server";

const REPO_NAME_RE = /^[\w.-]+$/;
const MAX_PATH_LENGTH = 500;
const MAX_FILE_SIZE_BYTES = 500_000;

function isSafeRepoPart(value: string) {
  return REPO_NAME_RE.test(value);
}

function normalizePath(value: string | null) {
  const path = (value ?? "").replace(/^\/+/, "").trim();
  if (!path || path.length > MAX_PATH_LENGTH || path.split("/").some((part) => part === "..")) {
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
      return NextResponse.json({ error: "File path is required" }, { status: 400 });
    }

    const file = await getRepoFileContent(owner, repo, path, await getCurrentGitHubToken());
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large to preview safely" },
        { status: 413 }
      );
    }

    return NextResponse.json({
      file: {
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type,
        sha: file.sha,
        html_url: file.html_url,
        download_url: file.download_url,
        content: file.decodedContent,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
