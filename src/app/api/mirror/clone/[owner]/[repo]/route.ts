import { NextResponse } from "next/server";
import { getGitHubCloneUrl } from "@/lib/mirror";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const cloneUrl = getGitHubCloneUrl(owner, repo);

  return NextResponse.json({ clone_url: cloneUrl });
}
