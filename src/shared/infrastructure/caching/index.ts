import type { RedisClientType } from "redis";

import { createClient } from "redis";

let _redis: RedisClientType | undefined;

async function getRedis() {
  if (_redis?.isOpen) return _redis;

  const REDIS_URL = Deno.env.get("REDIS_URL");
  if (!REDIS_URL) throw new Error("REDIS_URL is undefined");

  _redis = createClient({ url: REDIS_URL });

  _redis.on("error", (err) => console.error("Redis Client Error:", err));

  await _redis.connect();

  return _redis;
}

export { getRedis };
