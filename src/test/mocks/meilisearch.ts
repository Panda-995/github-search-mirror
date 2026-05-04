export const mockMeiliIndex = {
  search: () => Promise.resolve({ hits: [], estimatedTotalHits: 0 }),
  updateSettings: () => Promise.resolve(),
};

export const mockMeiliClient = {
  index: () => mockMeiliIndex,
};

// Mock for meilisearch module
export const Meilisearch = () => mockMeiliClient;
