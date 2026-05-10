import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL ?? "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
});

export async function initVectorCollection() {
  const collections = await qdrantClient.getCollections();
  const exists = collections.collections.some(
    (collection) => collection.name === "repo_embeddings"
  );

  if (!exists) {
    await qdrantClient.createCollection("repo_embeddings", {
      vectors: {
        size: 768,
        distance: "Cosine",
      },
    });
  }
}

export { qdrantClient };
