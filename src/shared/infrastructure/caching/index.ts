import type { RedisClientType } from "redis";

import { createClient } from "redis";

let _redis: RedisClientType | undefined;

function getRedis() {
  if (_redis) return _redis;

  const REDIS_URL = Deno.env.get("REDIS_URL");
  if (!REDIS_URL) throw new Error("REDIS_URL is undefined");

  _redis = createClient({ url: REDIS_URL });

  return _redis;
}

export { getRedis };
