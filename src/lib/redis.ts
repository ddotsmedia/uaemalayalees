import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function setWithExpiry(
  key: string,
  value: string,
  expirySeconds: number
): Promise<void> {
  await redis.setex(key, expirySeconds, value);
}

export async function get(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function increment(key: string): Promise<number> {
  return redis.incr(key);
}

export async function delete_key(key: string): Promise<number> {
  return redis.del(key);
}

export async function ttl(key: string): Promise<number> {
  return redis.ttl(key);
}

// Rate limiting helper
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  return current <= limit;
}

export default redis;
