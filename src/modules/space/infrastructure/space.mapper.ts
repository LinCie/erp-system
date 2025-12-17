import type { Insertable, Updateable } from "kysely";
import type { Spaces } from "@/shared/infrastructure/persistence/database.d.ts";
import type { SpaceEntity } from "../domain/space.entity.ts";

import { z } from "@hono/zod-openapi";

class SpaceMapper {
  private addressSchema = z.object({}).passthrough().nullable();

  private entitySchema = z.object({
    id: z.number(),
    name: z.string(),
    code: z.string(),
    address: this.addressSchema,
    notes: z.string().nullable(),
    status: z.enum(["active", "inactive", "archived"]),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  private insertableSchema = z.object({
    name: z.string(),
    code: z.string(),
    address: z.string().nullable(),
    notes: z.string().nullable(),
    status: z.enum(["active", "inactive", "archived"]),
  });

  private updateableSchema = this.insertableSchema.partial();

  /**
   * Transform space entity into insertable object
   */
  toInsertable(entity: Omit<SpaceEntity, "id">): Insertable<Spaces> {
    const data = {
      name: entity.name,
      code: entity.code,
      address: entity.address ? JSON.stringify(entity.address) : null,
      notes: entity.notes ?? null,
      status: entity.status,
    };
    return this.insertableSchema.parse(data);
  }

  /**
   * Transform partial space entity into updateable object
   */
  toUpdateable(entity: Partial<SpaceEntity>): Updateable<Spaces> {
    const { address, ...rest } = entity;
    const data = {
      ...rest,
      address: address !== undefined ? JSON.stringify(address) : undefined,
    };
    return this.updateableSchema.parse(data);
  }

  /**
   * Transform database row into space entity
   */
  toEntity(row: Record<string, unknown>): SpaceEntity {
    const data = {
      id: row.id,
      name: row.name,
      code: row.code,
      address: row.address ?? null,
      notes: row.notes ?? null,
      status: row.status,
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
    return this.entitySchema.parse(data);
  }
}

export { SpaceMapper };
