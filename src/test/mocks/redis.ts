export const mockRedis = {
  data: new Map<string, string>(),

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  },

  async setex(key: string, _ttl: number, value: string): Promise<void> {
    this.data.set(key, value);
  },

  async del(key: string): Promise<void> {
    this.data.delete(key);
  },

  reset() {
    this.data.clear();
  },
};

// Mock Redis class for testing
export default class Redis {
  get = mockRedis.get.bind(mockRedis);
  setex = mockRedis.setex.bind(mockRedis);
  del = mockRedis.del.bind(mockRedis);
}
