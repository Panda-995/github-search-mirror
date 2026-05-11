export interface RepoItem {
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  watchers: number;
  language: string | null;
  topics: string[];
  license: string | null;
  created_at: string;
  pushed_at: string;
  updated_at: string;
  homepage: string | null;
  html_url: string;
}

export interface SearchFilters {
  in?: ("name" | "description" | "readme")[];
  language?: string[];
  stars_min?: number;
  stars_max?: number;
  forks_min?: number;
  forks_max?: number;
  pushed_after?: string;
  created_after?: string;
  license?: string[];
  topic?: string[];
  user?: string;
  org?: string;
}

export interface SearchResult {
  total: number;
  page: number;
  per_page: number;
  results: RepoItem[];
  facets: {
    language: { name: string; count: number }[];
    license: { name: string; count: number }[];
    topic: { name: string; count: number }[];
  };
}

export interface TrendingRepo extends RepoItem {
  rank: number;
  stars_today: number;
  trend_score: number;
}

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  role: "USER" | "ADMIN";
}

export interface Collection {
  id: string;
  name: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  repoFullName: string;
  content: string;
  rating: number | null;
  userId: string;
  parentId: string | null;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
}
