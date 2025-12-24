import type { Insertable, Updateable } from "kysely";
import type { TransactionDetails } from "@/shared/infrastructure/persistence/database.d.ts";
import type { TransactionDetailEntity } from "../domain/transaction-detail.entity.ts";
import type { StatusType } from "@/shared/domain/types/status.type.ts";

import { z } from "@hono/zod-openapi";

class TransactionDetailMapper {
  // Internal Zod schemas for validation during transformation
  private entitySchema = z.object({
    id: z.number(),
    transaction_id: z.number(),
    detail_type: z.string().optional(),
    detail_id: z.number().optional(),
    model_type: z.string().optional(),
    model_id: z.number().optional(),
    sku: z.string().optional(),
    name: z.string().optional(),
    code: z.string().optional(),
    quantity: z.string(),
    price: z.string(),
    discount: z.string(),
    weight: z.string().optional(),
    cost_per_unit: z.string(),
    debit: z.string(),
    credit: z.string(),
    data: z.record(z.string(), z.any()).optional(),
    notes: z.string().optional(),
    status: z.enum(["active", "inactive", "archived"]),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  private insertableSchema = z.object({
    transaction_id: z.number(),
    detail_type: z.string().nullable(),
    detail_id: z.number().nullable(),
    model_type: z.string().nullable(),
    model_id: z.number().nullable(),
    sku: z.string().nullable(),
    name: z.string().nullable(),
    code: z.string().nullable(),
    quantity: z.string(),
    price: z.string(),
    discount: z.string(),
    weight: z.string().nullable(),
    cost_per_unit: z.string(),
    debit: z.string(),
    credit: z.string(),
    data: z.string().nullable(), // JSON string in DB
    notes: z.string().nullable(),
  });

  private updateableSchema = this.insertableSchema.partial();

  /**
   * Transform entity to insertable DB row
   * Converts undefined to null for DB compatibility
   * Converts objects to JSON strings
   */
  toInsertable(
    entity: TransactionDetailEntity,
  ): Insertable<TransactionDetails> {
    const data = {
      transaction_id: entity.transaction_id,
      detail_type: entity.detail_type ?? null,
      detail_id: entity.detail_id ?? null,
      model_type: entity.model_type ?? null,
      model_id: entity.model_id ?? null,
      sku: entity.sku ?? null,
      name: entity.name ?? null,
      code: entity.code ?? null,
      quantity: entity.quantity,
      price: entity.price,
      discount: entity.discount,
      weight: entity.weight ?? null,
      cost_per_unit: entity.cost_per_unit,
      debit: entity.debit,
      credit: entity.credit,
      data: entity.data ? JSON.stringify(entity.data) : null,
      notes: entity.notes ?? null,
    };
    return this.insertableSchema.parse(data);
  }

  /**
   * Transform partial entity to updateable DB row
   */
  toUpdateable(
    entity: Partial<TransactionDetailEntity>,
  ): Updateable<TransactionDetails> {
    const data: Record<string, unknown> = {};

    if (entity.transaction_id !== undefined) {
      data.transaction_id = entity.transaction_id;
    }
    if (entity.detail_type !== undefined) {
      data.detail_type = entity.detail_type ?? null;
    }
    if (entity.detail_id !== undefined) {
      data.detail_id = entity.detail_id ?? null;
    }
    if (entity.model_type !== undefined) {
      data.model_type = entity.model_type ?? null;
    }
    if (entity.model_id !== undefined) data.model_id = entity.model_id ?? null;
    if (entity.sku !== undefined) data.sku = entity.sku ?? null;
    if (entity.name !== undefined) data.name = entity.name ?? null;
    if (entity.code !== undefined) data.code = entity.code ?? null;
    if (entity.quantity !== undefined) data.quantity = entity.quantity;
    if (entity.price !== undefined) data.price = entity.price;
    if (entity.discount !== undefined) data.discount = entity.discount;
    if (entity.weight !== undefined) data.weight = entity.weight ?? null;
    if (entity.cost_per_unit !== undefined) {
      data.cost_per_unit = entity.cost_per_unit;
    }
    if (entity.debit !== undefined) data.debit = entity.debit;
    if (entity.credit !== undefined) data.credit = entity.credit;
    if (entity.data !== undefined) {
      data.data = entity.data ? JSON.stringify(entity.data) : null;
    }
    if (entity.notes !== undefined) data.notes = entity.notes ?? null;

    return this.updateableSchema.parse(data);
  }

  /**
   * Transform DB row to entity
   * Converts null to undefined for entity compatibility
   * Parses JSON strings to objects
   */
  toEntity(row: Record<string, unknown>): TransactionDetailEntity {
    const data = {
      id: row.id,
      transaction_id: row.transaction_id,
      detail_type: row.detail_type ?? undefined,
      detail_id: row.detail_id ?? undefined,
      model_type: row.model_type ?? undefined,
      model_id: row.model_id ?? undefined,
      sku: row.sku ?? undefined,
      name: row.name ?? undefined,
      code: row.code ?? undefined,
      quantity: String(row.quantity),
      price: String(row.price),
      discount: String(row.discount),
      weight: row.weight ? String(row.weight) : undefined,
      cost_per_unit: String(row.cost_per_unit),
      debit: String(row.debit),
      credit: String(row.credit),
      data: row.data
        ? (typeof row.data === "string"
          ? JSON.parse(row.data)
          : row.data as Record<string, unknown>)
        : undefined,
      notes: row.notes ?? undefined,
      status: (row.status ?? "active") as StatusType,
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
    const parsed = this.entitySchema.parse(data);
    return parsed as TransactionDetailEntity;
  }
}

export { TransactionDetailMapper };
