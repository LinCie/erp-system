import type { Insertable, Updateable } from "kysely";
import type { Players } from "@/shared/infrastructure/persistence/database.d.ts";
import type { ContactEntity } from "../domain/contact.entity.ts";

import { z } from "@hono/zod-openapi";

class ContactMapper {
  private entitySchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  private insertableSchema = z.object({
    name: z.string(),
    email: z.string().nullable(),
    status: z.enum(["active", "inactive", "archived"]),
  });

  private updateableSchema = this.insertableSchema.partial();

  toInsertable(entity: ContactEntity): Insertable<Players> {
    const data = {
      name: entity.name,
      email: entity.email ?? null,
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
      email: row.email ?? undefined,
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
    return this.entitySchema.parse(data);
  }
}

export { ContactMapper };
