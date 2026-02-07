import type { Insertable, Updateable } from "kysely";
import type { Players } from "@/shared/infrastructure/persistence/database.d.ts";
import type { ContactEntity } from "../domain/contact.entity.ts";

import { z } from "@hono/zod-openapi";

class ContactMapper {
  private entitySchema = z.object({
    id: z.number(),
    name: z.string(),
    status: z.enum(["active", "inactive", "archived"]),
    code: z.string().optional(),
    lastTrade: z.object({
      id: z.number(),
      number: z.string(),
    }).optional(),
    notes: z.string().optional(),
    email: z.string().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  private insertableSchema = z.object({
    name: z.string(),
    email: z.string().nullable(),
    code: z.string().nullable(),
    notes: z.string().nullable(),
    status: z.enum(["active", "inactive", "archived"]),
  });

  private updateableSchema = this.insertableSchema.partial();

  toInsertable(entity: ContactEntity): Insertable<Players> {
    const data = {
      name: entity.name,
      status: entity.status,
      email: entity.email ?? null,
      code: entity.code ?? null,
      notes: entity.notes ?? null,
    };
    return this.insertableSchema.parse(data);
  }

  toUpdateable(entity: Partial<ContactEntity>): Updateable<Players> {
    return this.updateableSchema.parse(entity);
  }

  toEntity(row: Record<string, unknown>): ContactEntity {
    const data = {
      id: row.id,
      name: row.name,
      status: row.status,
      email: row.email ?? undefined,
      code: row.code ?? undefined,
      lastTrade: row.last_trade ?? undefined,
      notes: row.notes ?? undefined,
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
    return this.entitySchema.parse(data);
  }
}

export { ContactMapper };
