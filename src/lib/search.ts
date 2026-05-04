import { Meilisearch } from "meilisearch";

const meiliClient = new Meilisearch({
  host: process.env.MEILISEARCH_HOST ?? "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_API_KEY,
});

export const repoIndex = meiliClient.index("repos");

export async function initSearchIndex() {
  await repoIndex.updateSettings({
    searchableAttributes: ["name", "owner", "description", "readme", "topics"],
    filterableAttributes: [
      "language",
      "stars",
      "forks",
      "license",
      "topics",
      "created_at",
      "pushed_at",
    ],
    sortableAttributes: ["stars", "forks", "updated_at", "created_at"],
    rankingRules: [
      "words",
      "typo",
      "proximity",
      "attribute",
      "sort",
      "exactness",
    ],
  });
}

export { meiliClient };
