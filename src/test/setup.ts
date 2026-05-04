import "@testing-library/jest-dom";

// Mock environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.MEILISEARCH_HOST = "http://localhost:7700";
process.env.MEILISEARCH_API_KEY = "test-key";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.QDRANT_URL = "http://localhost:6333";
process.env.ANTHROPIC_API_KEY = "sk-ant-test";
process.env.OPENAI_API_KEY = "sk-test";
process.env.DEEPSEEK_API_KEY = "sk-test";
