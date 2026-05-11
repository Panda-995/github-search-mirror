"use server";

const GITHUB_API = "https://api.github.com";

function getStartDate(range: "daily" | "weekly" | "monthly"): string {
  const now = new Date();
  switch (range) {
    case "daily":
      now.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      now.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      now.setHours(0, 0, 0, 0);
      break;
    case "monthly":
    default:
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      break;
  }
  return now.toISOString().split("T")[0];
}

interface TrendingRepo {
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  topics: string[];
  license: string | null;
  homepage: string | null;
  open_issues: number;
  watchers: number;
  trend_score: number;
  estimated_new_stars: number;
}

export async function getTrendingRepos(
  range: "daily" | "weekly" | "monthly" = "weekly",
  language?: string,
  token?: string | null
): Promise<TrendingRepo[]> {
  try {
    const dateStr = getStartDate(range);

    let langFilter = "";
    if (language) {
      langFilter = `+language:${encodeURIComponent(language)}`;
    }

    const url = `${GITHUB_API}/search/repositories?q=created:>=${dateStr}${langFilter}&sort=stars&order=desc&per_page=30`;

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "github-search-mirror",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers, next: { revalidate: 600 } });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    const maxStars = Math.max(...data.items.map((i: { stargazers_count: number }) => i.stargazers_count || 0), 1);

    return data.items.map((item: any) => {
      const stars = item.stargazers_count || 0;
      const trendScore = Math.round((stars / maxStars) * 100);

      let multiplier = 1;
      switch (range) {
        case "daily":
          multiplier = 7;
          break;
        case "weekly":
          multiplier = 1;
          break;
        case "monthly":
          multiplier = 0.25;
          break;
      }

      const estimatedNewStars = Math.round(stars * multiplier * (0.5 + Math.random() * 0.5));

      return {
        full_name: item.full_name || "",
        name: item.name || "",
        owner: item.owner?.login || "",
        description: item.description || null,
        language: item.language || null,
        stars,
        forks: item.forks_count || 0,
        pushed_at: item.pushed_at || "",
        created_at: item.created_at || "",
        updated_at: item.updated_at || "",
        topics: item.topics || [],
        license: item.license?.name || null,
        homepage: item.homepage || null,
        open_issues: item.open_issues_count || 0,
        watchers: item.watchers_count || 0,
        trend_score: trendScore,
        estimated_new_stars: estimatedNewStars,
      };
    });
  } catch {
    return [];
  }
}