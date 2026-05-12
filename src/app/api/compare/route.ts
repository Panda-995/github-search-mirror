import { getRepo, getRepoLanguages } from "@/lib/github";
import { calculateRepoHealth } from "@/lib/repo-insights";
import { getCurrentGitHubToken } from "@/server/github-token";
import { NextRequest, NextResponse } from "next/server";

const REPO_FULL_NAME_RE = /^[\w.-]+\/[\w.-]+$/;
const MAX_COMPARE_REPOS = 5;

function parseRepos(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, MAX_COMPARE_REPOS);
}

export async function GET(request: NextRequest) {
  try {
    const repoNames = parseRepos(request.nextUrl.searchParams.get("repos"));
    if (repoNames.length === 0) {
      return NextResponse.json({ repos: [], errors: [] });
    }
    if (repoNames.some((name) => !REPO_FULL_NAME_RE.test(name))) {
      return NextResponse.json({ error: "Invalid repository list" }, { status: 400 });
    }

    const token = await getCurrentGitHubToken();
    const settled = await Promise.allSettled(
      repoNames.map(async (fullName) => {
        const [owner, repo] = fullName.split("/");
        const [repoData, languages] = await Promise.all([
          getRepo(owner, repo, token),
          getRepoLanguages(owner, repo, token).catch(() => ({} as Record<string, number>)),
        ]);
        const health = calculateRepoHealth({
          full_name: repoData.full_name,
          name: repoData.name,
          owner: repoData.owner.login,
          stargazers_count: repoData.stargazers_count,
          forks_count: repoData.forks_count,
          open_issues_count: repoData.open_issues_count,
          watchers_count: repoData.watchers_count,
          language: repoData.language,
          description: repoData.description,
          license: repoData.license,
          created_at: repoData.created_at,
          pushed_at: repoData.pushed_at,
          updated_at: repoData.updated_at,
          homepage: repoData.homepage,
          topics: repoData.topics,
          has_readme: true,
        });

        return {
          full_name: repoData.full_name,
          name: repoData.name,
          owner: repoData.owner.login,
          description: repoData.description,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          open_issues: repoData.open_issues_count,
          watchers: repoData.watchers_count,
          language: repoData.language,
          languages,
          license: repoData.license?.name ?? null,
          topics: repoData.topics,
          created_at: repoData.created_at,
          pushed_at: repoData.pushed_at,
          updated_at: repoData.updated_at,
          homepage: repoData.homepage,
          html_url: repoData.html_url,
          health: {
            score: health.score,
            grade: health.grade,
            label: health.label,
            risks: health.risks.slice(0, 3),
            suggestions: health.suggestions.slice(0, 3),
          },
        };
      })
    );

    return NextResponse.json({
      repos: settled.flatMap((item) => (item.status === "fulfilled" ? [item.value] : [])),
      errors: settled
        .map((item, index) =>
          item.status === "rejected"
            ? {
                repo: repoNames[index],
                message: item.reason instanceof Error ? item.reason.message : "Failed to load repo",
              }
            : null
        )
        .filter(Boolean),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compare request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
