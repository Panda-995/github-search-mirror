import { NextResponse } from "next/server";
import { getCloneUrl, getGitHubCloneUrl } from "@/lib/mirror";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const { owner, repo } = await params;
    const hasMirrorBase = Boolean(process.env.MIRROR_BASE_URL);
    const cloneUrl = hasMirrorBase ? getCloneUrl(owner, repo) : getGitHubCloneUrl(owner, repo);

    return NextResponse.json({ clone_url: cloneUrl, mirrored: hasMirrorBase });
  } catch (error) {
    const message = error instanceof Error ? error.message : "获取克隆地址失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
