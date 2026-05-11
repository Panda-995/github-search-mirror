import { Meilisearch } from "meilisearch";

const meiliClient = new Meilisearch({
  host: process.env.MEILISEARCH_HOST ?? "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_API_KEY,
});

export const repoIndex = meiliClient.index("repos");

export { meiliClient };
