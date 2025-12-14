import type { Insertable, Updateable } from "kysely";
import type { Items } from "@/shared/infrastructure/persistence/database.d.ts";
import type { ItemEntity } from "../domain/item.entity.ts";

import { z } from "@hono/zod-openapi";

class ItemMapper {
  private entitySchema = z.object({
    id: z.number(),
    name: z.string(),
    code: z.string().optional(),
    description: z.string().optional(),
    sku: z.string().optional(),
    cost: z.string(),
    price: z.string(),
    weight: z.string(),
    notes: z.string().optional(),
    status: z.enum(["active", "inactive", "archived"]),
    space_id: z.number(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  private insertableSchema = z.object({
    name: z.string(),
    code: z.string().nullable(),
    description: z.string().nullable(),
    sku: z.string().nullable(),
    cost: z.string(),
    price: z.string(),
    weight: z.string(),
    notes: z.string().nullable(),
    status: z.enum(["active", "inactive", "archived"]),
    space_id: z.number(),
  });

  private updateableSchema = this.insertableSchema.partial().omit({
    space_id: true,
  });

  /**
   * Transform item entity into insertable object
   *
   * @param entity - The item entity
   * @returns An insertable object
   */
  toInsertable(entity: ItemEntity): Insertable<Items> {
    const data = {
      id: entity.id,
      name: entity.name,
      cost: entity.cost,
      price: entity.price,
      weight: entity.weight,
      status: entity.status,
      space_id: entity.space_id,
      code: entity.code ?? null,
      description: entity.description ?? null,
      sku: entity.sku ?? null,
      notes: entity.notes ?? null,
      created_at: entity.created_at ?? null,
      updated_at: entity.updated_at ?? null,
      deleted_at: entity.deleted_at ?? null,
    };
    return this.insertableSchema.parse(data);
  }

  /**
   * Transform item entity into updateable object
   *
   * @param entity - The item entity
   * @returns An updateable object
   */
  toUpdateable(entity: Partial<ItemEntity>): Updateable<Items> {
    return this.updateableSchema.parse(entity);
  }

  /**
   * Tranform database row into item entity
   *
   * @param row - The row from the database
   * @returns An item entity
   */
  toEntity(row: Record<string, unknown>): ItemEntity {
    const data = {
      id: row.id,
      name: row.name,
      cost: row.cost,
      price: row.price,
      weight: row.weight,
      status: row.status,
      space_id: row.space_id ?? undefined,
      code: row.code ?? undefined,
      description: row.description ?? undefined,
      sku: row.sku ?? undefined,
      notes: row.notes ?? undefined,
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
    return this.entitySchema.parse(data);
  }
}

export { ItemMapper };
