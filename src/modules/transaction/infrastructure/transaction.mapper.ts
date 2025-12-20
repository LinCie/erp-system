import type { Insertable, Updateable } from "kysely";
import type { Transactions } from "@/shared/infrastructure/persistence/database.d.ts";
import type { TransactionEntity } from "../domain/transaction.entity.ts";

import { z } from "@hono/zod-openapi";

class TransactionMapper {
  private entitySchema = z.object({
    id: z.number(),
    name: z.string(),
    status: z.enum(["active", "inactive", "archived"]),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  private insertableSchema = z.object({
    name: z.string(),
    status: z.enum(["active", "inactive", "archived"]),
  });

  private updateableSchema = this.insertableSchema.partial();

  toInsertable(entity: TransactionEntity): Insertable<Transactions> {
    const data = {
      name: entity.name,
      status: entity.status,
    };
    return this.insertableSchema.parse(data);
  }

  toUpdateable(entity: Partial<TransactionEntity>): Updateable<Transactions> {
    return this.updateableSchema.parse(entity);
  }

  toEntity(row: Record<string, unknown>): TransactionEntity {
    const data = {
      id: row.id,
      name: row.name,
      status: row.status,
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
    return this.entitySchema.parse(data);
  }
}

export { TransactionMapper };
