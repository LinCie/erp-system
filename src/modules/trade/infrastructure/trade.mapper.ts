import type { Insertable, Updateable } from "kysely";
import type {
  TransactionDetails,
  Transactions,
} from "@/shared/infrastructure/persistence/database.d.ts";
import type { TradeEntity } from "../domain/trade.entity.ts";
import type { TradeDetailType } from "../domain/trade-detail.type.ts";
import type { TradeDetailInput } from "../application/trade-repository.interface.ts";
import type { PlayerInfo } from "../domain/player-info.type.ts";

import { z } from "@hono/zod-openapi";
import { TRADE_STATUS } from "../domain/trade-status.type.ts";

class TradeMapper {
  // File schema for JSON field
  private fileSchema = z.object({
    name: z.string(),
    path: z.string(),
    size: z.coerce.number(),
  });

  // Link schema for JSON field
  private linkSchema = z.object({
    url: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
  });

  // Player info schema for relationships
  private playerInfoSchema = z.object({
    id: z.number(),
    code: z.string().optional(),
    name: z.string(),
  });

  // Trade detail schema for entity transformation
  private detailEntitySchema = z.object({
    id: z.number(),
    item_id: z.number().optional(),
    model_type: z.string(),
    sku: z.string().optional(),
    name: z.string().optional(),
    quantity: z.number(),
    price: z.number(),
    discount: z.number(),
    weight: z.number(),
    debit: z.number(),
    credit: z.number(),
    notes: z.string().optional(),
  });

  // Trade entity schema
  private entitySchema = z.object({
    id: z.number(),
    number: z.string(),
    space_id: z.number(),
    status: z.union([z.string(), z.enum(TRADE_STATUS)]),
    total: z.string(),
    sent_time: z.coerce.date().optional(),
    received_time: z.coerce.date().optional(),
    sender_id: z.number().optional(),
    receiver_id: z.number().optional(),
    handler_id: z.number().optional(),
    parent_id: z.number().optional(),
    sender_notes: z.string().optional(),
    receiver_notes: z.string().optional(),
    handler_notes: z.string().optional(),
    description: z.string().optional(),
    fee: z.string().optional(),
    files: z.array(this.fileSchema).optional(),
    tags: z.array(z.string()).optional(),
    links: z.array(this.linkSchema).optional(),
    details: z.array(this.detailEntitySchema).optional(),
    sender: this.playerInfoSchema.optional(),
    receiver: this.playerInfoSchema.optional(),
    handler: this.playerInfoSchema.optional(),
    sku: z.string().optional(),
    all_notes: z.string().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  // Insertable schema for database
  private insertableSchema = z.object({
    number: z.string().nullable(),
    space_type: z.string(),
    space_id: z.number(),
    model_type: z.string(),
    sender_type: z.string(),
    sender_id: z.number().nullable(),
    sent_time: z.date().nullable(),
    sender_notes: z.string().nullable(),
    status: z.string(),
    total: z.string(),
    fee: z.union([z.string(), z.number()]).optional(),
    files: z.string().nullable(),
    tags: z.string().nullable(),
    links: z.string().nullable(),
  });

  // Updateable schema for database
  private updateableSchema = z.object({
    handler_type: z.string().optional(),
    handler_id: z.number().nullable().optional(),
    receiver_type: z.string().optional(),
    receiver_id: z.number().nullable().optional(),
    parent_type: z.string().nullable().optional(),
    parent_id: z.number().nullable().optional(),
    sent_time: z.date().nullable().optional(),
    received_time: z.date().nullable().optional(),
    sender_notes: z.string().nullable().optional(),
    receiver_notes: z.string().nullable().optional(),
    handler_notes: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    status: z.string().optional(),
    total: z.string().optional(),
    fee: z.string().optional(),
    files: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
    links: z.string().nullable().optional(),
  });

  // Detail insertable schema
  private detailInsertableSchema = z.object({
    transaction_id: z.number(),
    detail_type: z.string(),
    detail_id: z.number().nullable(),
    model_type: z.string(),
    sku: z.string().nullable(),
    name: z.string().nullable(),
    quantity: z.number(),
    price: z.number(),
    discount: z.number().nullable(),
    weight: z.number().nullable(),
    debit: z.number(),
    credit: z.number(),
    notes: z.string().nullable(),
  });

  /**
   * Transform trade entity to insertable database row
   */
  toInsertable(
    entity: Partial<TradeEntity> & { space_id: number; sender_id: number },
  ): Insertable<Transactions> {
    const data = {
      number: entity.number ?? null,
      space_type: "SPACE",
      space_id: entity.space_id,
      model_type: "TRD",
      sender_type: "PLAY",
      sender_id: entity.sender_id ?? null,
      sent_time: entity.sent_time ?? null,
      sender_notes: entity.sender_notes ?? null,
      status: entity.status ?? "TX_DRAFT",
      total: entity.total ?? "0",
      fee: entity.fee ?? undefined,
      files: entity.files ? JSON.stringify(entity.files) : null,
      tags: entity.tags ? JSON.stringify(entity.tags) : null,
      links: entity.links ? JSON.stringify(entity.links) : null,
    };
    return this.insertableSchema.parse(data);
  }

  /**
   * Transform partial trade entity to updateable database row
   */
  toUpdateable(entity: Partial<TradeEntity>): Updateable<Transactions> {
    const data: Record<string, unknown> = {};

    if (entity.handler_id !== undefined) {
      data.handler_type = "PLAY";
      data.handler_id = entity.handler_id ?? null;
    }
    if (entity.receiver_id !== undefined) {
      data.receiver_type = "PLAY";
      data.receiver_id = entity.receiver_id ?? null;
    }
    if (entity.parent_id !== undefined) {
      data.parent_type = entity.parent_id ? "TX" : null;
      data.parent_id = entity.parent_id ?? null;
    }
    if (entity.sent_time !== undefined) {
      data.sent_time = entity.sent_time ?? null;
    }
    if (entity.received_time !== undefined) {
      data.received_time = entity.received_time ?? null;
    }
    if (entity.sender_notes !== undefined) {
      data.sender_notes = entity.sender_notes ?? null;
    }
    if (entity.receiver_notes !== undefined) {
      data.receiver_notes = entity.receiver_notes ?? null;
    }
    if (entity.handler_notes !== undefined) {
      data.handler_notes = entity.handler_notes ?? null;
    }
    if (entity.description !== undefined) {
      data.description = entity.description ?? null;
    }
    if (entity.status !== undefined) {
      data.status = entity.status;
    }
    if (entity.total !== undefined) {
      data.total = entity.total;
    }
    if (entity.fee !== undefined) {
      data.fee = entity.fee ?? undefined;
    }
    if (entity.files !== undefined) {
      data.files = entity.files ? JSON.stringify(entity.files) : null;
    }
    if (entity.tags !== undefined) {
      data.tags = entity.tags ? JSON.stringify(entity.tags) : null;
    }
    if (entity.links !== undefined) {
      data.links = entity.links ? JSON.stringify(entity.links) : null;
    }

    return this.updateableSchema.parse(data);
  }

  /**
   * Transform database row to trade entity
   */
  toEntity(row: Record<string, unknown>): TradeEntity {
    // Parse JSON fields
    let files: TradeEntity["files"];
    if (row.files) {
      try {
        files = typeof row.files === "string"
          ? JSON.parse(row.files)
          : row.files;
      } catch {
        files = undefined;
      }
    }

    let tags: TradeEntity["tags"];
    if (row.tags) {
      try {
        tags = typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags;
      } catch {
        tags = undefined;
      }
    }

    let links: TradeEntity["links"];
    if (row.links) {
      try {
        links = typeof row.links === "string"
          ? JSON.parse(row.links)
          : row.links;
      } catch {
        links = undefined;
      }
    }

    // Transform details if present
    let details: TradeDetailType[] | undefined;
    if (Array.isArray(row.details) && row.details.length > 0) {
      details = row.details.map((d: Record<string, unknown>) =>
        this.detailToEntity(d)
      );
    }

    // Transform player relationships if present
    let sender: PlayerInfo | undefined;
    if (row.sender && typeof row.sender === "object") {
      const s = row.sender as Record<string, unknown>;
      if (s.id && s.name) {
        sender = {
          id: s.id as number,
          code: (s.code as string) ?? undefined,
          name: s.name as string,
        };
      }
    }

    let receiver: PlayerInfo | undefined;
    if (row.receiver && typeof row.receiver === "object") {
      const r = row.receiver as Record<string, unknown>;
      if (r.id && r.name) {
        receiver = {
          id: r.id as number,
          code: (r.code as string) ?? undefined,
          name: r.name as string,
        };
      }
    }

    let handler: PlayerInfo | undefined;
    if (row.handler && typeof row.handler === "object") {
      const h = row.handler as Record<string, unknown>;
      if (h.id && h.name) {
        handler = {
          id: h.id as number,
          code: (h.code as string) ?? undefined,
          name: h.name as string,
        };
      }
    }

    // Compute SKU from details (comma-separated list)
    let sku: string | undefined;
    if (details && details.length > 0) {
      const skuList = details
        .map((d) => d.sku)
        .filter((s): s is string => !!s);
      if (skuList.length > 0) {
        sku = skuList.join(", ");
      }
    }

    // Compute all_notes (sender_notes + handler_notes)
    const senderNotes = row.sender_notes as string | undefined;
    const handlerNotes = row.handler_notes as string | undefined;
    let all_notes: string | undefined;
    if (senderNotes || handlerNotes) {
      const parts = [senderNotes, handlerNotes].filter(Boolean);
      all_notes = parts.join("\n");
    }

    const data = {
      id: row.id,
      number: row.number ?? "",
      space_id: row.space_id,
      status: row.status ?? "TX_DRAFT",
      total: row.total ?? "0",
      sent_time: row.sent_time ?? undefined,
      received_time: row.received_time ?? undefined,
      sender_id: row.sender_id ?? undefined,
      receiver_id: row.receiver_id ?? undefined,
      handler_id: row.handler_id ?? undefined,
      parent_id: row.parent_id ?? undefined,
      sender_notes: row.sender_notes ?? undefined,
      receiver_notes: row.receiver_notes ?? undefined,
      handler_notes: row.handler_notes ?? undefined,
      description: row.description ?? undefined,
      fee: row.fee ?? undefined,
      files,
      tags,
      links,
      details,
      sender,
      receiver,
      handler,
      sku,
      all_notes,
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };

    return this.entitySchema.parse(data);
  }

  /**
   * Transform trade detail input to insertable database row
   */
  detailToInsertable(
    transactionId: number,
    detail: TradeDetailInput,
  ): Insertable<TransactionDetails> {
    // Calculate debit and credit based on quantity
    const quantity = detail.quantity;
    const debit = quantity >= 0 ? detail.quantity : "0";
    const credit = quantity < 0 ? Math.abs(quantity).toString() : "0";

    const data = {
      transaction_id: transactionId,
      detail_type: "ITM",
      detail_id: detail.item_id ?? null,
      model_type: detail.model_type,
      sku: detail.sku ?? null,
      name: detail.name ?? null,
      quantity: detail.quantity,
      price: detail.price,
      discount: detail.discount ?? "0",
      weight: detail.weight ?? "0",
      debit,
      credit,
      notes: detail.notes ?? null,
    };

    return this.detailInsertableSchema.parse(data);
  }

  /**
   * Transform database row to trade detail entity
   */
  detailToEntity(row: Record<string, unknown>): TradeDetailType {
    const data = {
      id: row.id,
      item_id: row.detail_id ?? undefined,
      model_type: row.model_type ?? "UNDF",
      sku: row.sku ?? undefined,
      name: row.name ?? undefined,
      quantity: row.quantity ?? "0",
      price: row.price ?? "0",
      discount: row.discount ?? "0",
      weight: row.weight ?? "0",
      debit: row.debit ?? "0",
      credit: row.credit ?? "0",
      notes: row.notes ?? undefined,
    };

    return this.detailEntitySchema.parse(data);
  }
}

export { TradeMapper };
