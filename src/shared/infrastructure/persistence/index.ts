import { createPool } from "mysql2";
import { Kysely, MysqlDialect, MysqlPool } from "kysely";
import { DB } from "./database.d.ts";

let _db: Kysely<DB> | undefined;

function getDatabase() {
  if (_db) return _db;

  const DATABASE_URL = Deno.env.get("DATABASE_URL");
  if (!DATABASE_URL) throw new Error("DATABASE_URL is undefined");

  const pool = createPool(DATABASE_URL) as unknown as MysqlPool;

  const dialect = new MysqlDialect({
    pool,
  });

  _db = new Kysely<DB>({
    dialect,
  });

  return _db;
}

export type PersistenceType = Kysely<DB>;
export { getDatabase };
