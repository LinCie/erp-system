import type { Insertable, Updateable } from "kysely";
import type {
  TransactionDetails,
  Transactions,
} from "@/shared/infrastructure/persistence/database.d.ts";
import type { TradeEntity } from "../domain/entities/trade.entity.ts";
import type { TradeDetailEntity } from "../domain/entities/trade-detail.entity.ts";
import type { CreateTradeDetailProps } from "../application/types/create-trade-detail.type.ts";
import type { UpdateTradeDetailProps } from "../application/types/update-trade-detail.type.ts";

import { z } from "@hono/zod-openapi";
import { TRADE_STATUS } from "../domain/types/trade-status.type.ts";

class TradeMapper {
  // ============================================================================
  // Sub-schemas for nested objects
  // ============================================================================

  private fileSchema = z.object({
    name: z.string(),
    path: z.string(),
    size: z.number(),
  });

  private linkSchema = z.object({
    url: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
  });

  private tradePlayerSchema = z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string(),
  });

  private tradeTimestampSchema = z.object({
    createdAt: z.date(),
    packagedAt: z.date().nullable(),
    shippedAt: z.date().nullable(),
    deliveredAt: z.date().nullable(),
    cancelledAt: z.date().nullable(),
    completedAt: z.date().nullable(),
  });

  private tradeAddressSchema = z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  });

  private tradeItemEntitySchema = z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    sku: z.string().optional(),
  });

  private tradePlayerEntitySchema = z.object({
    id: z.number(),
    code: z.string().optional(),
    name: z.string(),
  });

  // ============================================================================
  // Entity schemas (camelCase where applicable, undefined for optional, NO null values)
  // ============================================================================

  private tradeDetailEntitySchema: z.ZodType<TradeDetailEntity> = z.object({
    id: z.number(),
    modelId: z.number(),
    modelType: z.string(),
    detailType: z.string(),
    item: this.tradeItemEntitySchema.optional(),
    quantity: z.number(),
    price: z.number(),
    discount: z.number(),
    weight: z.number(),
    debit: z.number(),
    credit: z.number(),
    notes: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().optional(),
  });

  // Base entity schema without conditional unions
  private baseTradeEntitySchema = z.object({
    id: z.number(),
    number: z.string(),
    spaceId: z.number(),
    status: z.enum(TRADE_STATUS),
    total: z.string(),
    description: z.string().optional(),
    fee: z.string().optional(),
    files: z.array(this.fileSchema).optional(),
    tags: z.array(z.string()).optional(),
    links: z.array(this.linkSchema).optional(),
    senderNotes: z.string().optional(),
    receiverNotes: z.string().optional(),
    handlerNotes: z.string().optional(),
    players: this.tradePlayerSchema.optional(),
    timestamps: this.tradeTimestampSchema.optional(),
    addresses: this.tradeAddressSchema.optional(),
    sentTime: z.date().optional(),
    receivedTime: z.date().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().optional(),
  });

  // Discriminated union schemas for conditional properties
  private tradeWithChildrenSchema = z.object({
    withChildren: z.literal(true),
    children: z.array(z.lazy(() => this.tradeEntitySchema)),
  }) as z.ZodType<{ withChildren: true; children: TradeEntity[] }>;

  private tradeWithoutChildrenSchema = z.object({
    withChildren: z.literal(false),
    children: z.never(),
  }) as z.ZodType<{ withChildren: false; children: never }>;

  private tradeWithParentSchema = z.object({
    withParent: z.literal(true),
    parent: z.lazy(() => this.tradeEntitySchema).optional(),
  }) as z.ZodType<{ withParent: true; parent?: TradeEntity }>;

  private tradeWithoutParentSchema = z.object({
    withParent: z.literal(false),
    parent: z.never(),
  }) as z.ZodType<{ withParent: false; parent: never }>;

  private tradeWithPlayersSchema = z.object({
    withPlayers: z.literal(true),
    sender: this.tradePlayerEntitySchema.optional(),
    receiver: this.tradePlayerEntitySchema.optional(),
    handler: this.tradePlayerEntitySchema.optional(),
  }) as z.ZodType<{
    withPlayers: true;
    sender?: { id: number; code?: string; name: string };
    receiver?: { id: number; code?: string; name: string };
    handler?: { id: number; code?: string; name: string };
  }>;

  private tradeWithoutPlayersSchema = z.object({
    withPlayers: z.literal(false),
    sender: z.never(),
    receiver: z.never(),
    handler: z.never(),
  }) as z.ZodType<{
    withPlayers: false;
    sender: never;
    receiver: never;
    handler: never;
  }>;

  private tradeWithDetailsSchema = z.object({
    withDetails: z.literal(true),
    details: z.array(this.tradeDetailEntitySchema),
  }) as z.ZodType<{ withDetails: true; details: TradeDetailEntity[] }>;

  private tradeWithoutDetailsSchema = z.object({
    withDetails: z.literal(false),
    details: z.never(),
  }) as z.ZodType<{ withDetails: false; details: never }>;

  // Combined entity schema using intersections
  private tradeEntitySchema: z.ZodType<TradeEntity> = z.intersection(
    this.baseTradeEntitySchema,
    z.intersection(
      z.union([
        this.tradeWithChildrenSchema,
        this.tradeWithoutChildrenSchema,
      ]),
      z.intersection(
        z.union([
          this.tradeWithParentSchema,
          this.tradeWithoutParentSchema,
        ]),
        z.intersection(
          z.union([
            this.tradeWithPlayersSchema,
            this.tradeWithoutPlayersSchema,
          ]),
          z.union([
            this.tradeWithDetailsSchema,
            this.tradeWithoutDetailsSchema,
          ]),
        ),
      ),
    ),
  );

  // ============================================================================
  // Persistence schemas (snake_case, null for optional, NO undefined values)
  // ============================================================================

  private insertableSchema = z.object({
    space_id: z.number(),
    sender_id: z.number(),

    number: z.string().nullable(),
    status: z.string().nullable(),
    sent_time: z.date().nullable(),
    sender_notes: z.string().nullable(),

    created_at: z.date().nullable(),
    updated_at: z.date().nullable(),
  });

  private updateableSchema = z.object({
    number: z.string().nullable().optional(),
    sender_id: z.number().nullable().optional(),
    sent_time: z.date().nullable().optional(),
    sender_notes: z.string().nullable().optional(),
    status: z.string().optional(),
    total: z.string().optional(),
    receiver_id: z.number().nullable().optional(),
    receiver_notes: z.string().nullable().optional(),
    handler_id: z.number().nullable().optional(),
    handler_notes: z.string().nullable().optional(),
    parent_id: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    fee: z.string().optional(),
    files: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
    links: z.string().nullable().optional(),
    players: z.string().nullable().optional(),
    timestamps: z.string().nullable().optional(),
    addresses: z.string().nullable().optional(),
    received_time: z.date().nullable().optional(),
  });

  private detailInsertableSchema = z.object({
    transaction_id: z.number(),
    model_id: z.number(),
    model_type: z.string(),
    detail_type: z.string(),
    quantity: z.string(),
    price: z.string(),
    discount: z.string().nullable(),
    weight: z.string().nullable(),
    debit: z.string(),
    credit: z.string(),
    sku: z.string().nullable(),
    name: z.string().nullable(),
    notes: z.string().nullable(),
  });

  private detailUpdateableSchema = z.object({
    model_id: z.number().optional(),
    model_type: z.string().optional(),
    detail_type: z.string().optional(),
    quantity: z.string().optional(),
    price: z.string().optional(),
    discount: z.string().nullable().optional(),
    weight: z.string().nullable().optional(),
    debit: z.string().optional(),
    credit: z.string().optional(),
    sku: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  });

  // ============================================================================
  // Helper methods for JSON parsing
  // ============================================================================

  private parseJsonField<T>(value: unknown): T | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as T;
      } catch {
        return undefined;
      }
    }
    return value as T;
  }

  private stringifyJsonField<T>(value: T | undefined): string | null {
    if (value === undefined) {
      return null;
    }
    return JSON.stringify(value);
  }

  // ============================================================================
  // Entity transformation methods
  // ============================================================================

  /**
   * Transform database row to trade entity (camelCase where applicable, no null values)
   */
  toEntity(row: Record<string, unknown>): TradeEntity {
    // Parse JSON fields
    const files = this.parseJsonField<TradeEntity["files"]>(row.files);
    const tags = this.parseJsonField<TradeEntity["tags"]>(row.tags);
    const links = this.parseJsonField<TradeEntity["links"]>(row.links);
    const players = this.parseJsonField<TradeEntity["players"]>(row.players);
    const timestamps = this.parseJsonField<TradeEntity["timestamps"]>(
      row.timestamps,
    );
    const addresses = this.parseJsonField<TradeEntity["addresses"]>(
      row.addresses,
    );

    // Transform details if present
    let details: TradeDetailEntity[] | undefined;
    if (Array.isArray(row.details) && row.details.length > 0) {
      details = row.details.map((d: Record<string, unknown>) =>
        this.detailToEntity(d)
      );
    }

    // Transform children if present
    let children: TradeEntity[] | undefined;
    if (Array.isArray(row.children) && row.children.length > 0) {
      children = row.children.map((c: Record<string, unknown>) =>
        this.toEntity(c)
      );
    }

    // Transform parent if present
    let parent: TradeEntity | undefined;
    if (row.parent && typeof row.parent === "object") {
      parent = this.toEntity(row.parent as Record<string, unknown>);
    }

    // Transform player relationships if present
    let sender: TradeEntity["sender"] | undefined;
    if (row.sender && typeof row.sender === "object") {
      const s = row.sender as Record<string, unknown>;
      sender = {
        id: Number(s.id),
        code: s.code ? String(s.code) : undefined,
        name: String(s.name),
      };
    }

    let receiver: TradeEntity["receiver"] | undefined;
    if (row.receiver && typeof row.receiver === "object") {
      const r = row.receiver as Record<string, unknown>;
      receiver = {
        id: Number(r.id),
        code: r.code ? String(r.code) : undefined,
        name: String(r.name),
      };
    }

    let handler: TradeEntity["handler"] | undefined;
    if (row.handler && typeof row.handler === "object") {
      const h = row.handler as Record<string, unknown>;
      handler = {
        id: Number(h.id),
        code: h.code ? String(h.code) : undefined,
        name: String(h.name),
      };
    }

    // Determine conditional flags
    const withChildren = children !== undefined && children.length > 0;
    const withParent = parent !== undefined;
    const withPlayers = sender !== undefined || receiver !== undefined ||
      handler !== undefined;
    const withDetails = details !== undefined && details.length > 0;

    const data = {
      id: Number(row.id),
      number: String(row.number ?? ""),
      spaceId: Number(row.space_id ?? 0),
      status: String(row.status ?? "TX_DRAFT"),
      total: String(row.total ?? "0"),
      description: row.description ? String(row.description) : undefined,
      fee: row.fee ? String(row.fee) : undefined,
      files,
      tags,
      links,
      senderNotes: row.sender_notes ? String(row.sender_notes) : undefined,
      receiverNotes: row.receiver_notes
        ? String(row.receiver_notes)
        : undefined,
      handlerNotes: row.handler_notes ? String(row.handler_notes) : undefined,
      players,
      timestamps,
      addresses,
      sentTime: row.sent_time ? new Date(String(row.sent_time)) : undefined,
      receivedTime: row.received_time
        ? new Date(String(row.received_time))
        : undefined,
      createdAt: row.created_at ? new Date(String(row.created_at)) : undefined,
      updatedAt: row.updated_at ? new Date(String(row.updated_at)) : undefined,
      deletedAt: row.deleted_at ? new Date(String(row.deleted_at)) : undefined,
      withChildren,
      children: withChildren ? children : undefined,
      withParent,
      parent: withParent ? parent : undefined,
      withPlayers,
      sender: withPlayers ? sender : undefined,
      receiver: withPlayers ? receiver : undefined,
      handler: withPlayers ? handler : undefined,
      withDetails,
      details: withDetails ? details : undefined,
    };

    return this.tradeEntitySchema.parse(data);
  }

  /**
   * Transform trade entity to insertable database row (snake_case, no undefined values)
   */
  toInsertable(
    entity: {
      spaceId: number;
      senderId: number;
      sentTime?: Date;
      senderNotes?: string;
      number?: string;
      status?: string;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ): Insertable<Transactions> {
    const data = {
      space_id: entity.spaceId,
      sender_id: entity.senderId,
      sent_time: entity.sentTime ?? null,
      sender_notes: entity.senderNotes ?? null,
      number: entity.number ?? null,
      status: entity.status ?? null,
      created_at: entity.createdAt ?? null,
      updated_at: entity.updatedAt ?? null,
    };

    return this.insertableSchema.parse(data) as Insertable<Transactions>;
  }

  /**
   * Transform partial trade entity to updateable database row (snake_case, no undefined values)
   */
  toUpdateable(entity: Partial<TradeEntity>): Updateable<Transactions> {
    const data: Record<string, unknown> = {};

    if (entity.handlerId !== undefined) {
      data.handler_id = entity.handlerId;
    }
    if (entity.receiverId !== undefined) {
      data.receiver_id = entity.receiverId;
    }
    if (entity.parentId !== undefined) {
      data.parent_id = entity.parentId;
    }

    if (entity.number !== undefined) {
      data.number = entity.number;
    }
    if (entity.status !== undefined) {
      data.status = entity.status;
    }
    if (entity.total !== undefined) {
      data.total = entity.total;
    }
    if (entity.description !== undefined) {
      data.description = entity.description;
    }
    if (entity.fee !== undefined) {
      data.fee = entity.fee;
    }
    if (entity.files !== undefined) {
      data.files = this.stringifyJsonField(entity.files);
    }
    if (entity.tags !== undefined) {
      data.tags = this.stringifyJsonField(entity.tags);
    }
    if (entity.links !== undefined) {
      data.links = this.stringifyJsonField(entity.links);
    }
    if (entity.players !== undefined) {
      data.players = this.stringifyJsonField(entity.players);
    }
    if (entity.timestamps !== undefined) {
      data.timestamps = this.stringifyJsonField(entity.timestamps);
    }
    if (entity.addresses !== undefined) {
      data.addresses = this.stringifyJsonField(entity.addresses);
    }
    if (entity.senderNotes !== undefined) {
      data.sender_notes = entity.senderNotes;
    }
    if (entity.receiverNotes !== undefined) {
      data.receiver_notes = entity.receiverNotes;
    }
    if (entity.handlerNotes !== undefined) {
      data.handler_notes = entity.handlerNotes;
    }
    if (entity.sentTime !== undefined) {
      data.sent_time = entity.sentTime;
    }
    if (entity.receivedTime !== undefined) {
      data.received_time = entity.receivedTime;
    }

    return this.updateableSchema.parse(data) as Updateable<Transactions>;
  }

  // ============================================================================
  // Detail transformation methods
  // ============================================================================

  /**
   * Transform database row to trade detail entity (camelCase, no null values)
   */
  detailToEntity(row: Record<string, unknown>): TradeDetailEntity {
    // Transform item if present
    let item: TradeDetailEntity["item"] | undefined;
    if (row.item && typeof row.item === "object") {
      const i = row.item as Record<string, unknown>;
      item = {
        id: Number(i.id),
        name: String(i.name),
        price: Number(i.price),
        sku: i.sku ? String(i.sku) : undefined,
      };
    }

    const data = {
      id: Number(row.id),
      modelId: Number(row.model_id ?? 0),
      modelType: String(row.model_type ?? ""),
      detailType: String(row.detail_type ?? ""),
      item,
      quantity: Number(row.quantity ?? 0),
      price: Number(row.price ?? 0),
      discount: Number(row.discount ?? 0),
      weight: Number(row.weight ?? 0),
      debit: Number(row.debit ?? 0),
      credit: Number(row.credit ?? 0),
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: row.created_at ? new Date(String(row.created_at)) : undefined,
      updatedAt: row.updated_at ? new Date(String(row.updated_at)) : undefined,
      deletedAt: row.deleted_at ? new Date(String(row.deleted_at)) : undefined,
    };

    return this.tradeDetailEntitySchema.parse(data);
  }

  /**
   * Transform trade detail input to insertable database row (snake_case, no undefined values)
   */
  detailToInsertable(
    transactionId: number,
    detail: CreateTradeDetailProps,
  ): Insertable<TransactionDetails> {
    // Calculate debit and credit based on quantity
    const quantity = detail.quantity;
    const debit = quantity >= 0 ? quantity : 0;
    const credit = quantity < 0 ? Math.abs(quantity) : 0;

    const data = {
      transaction_id: transactionId,
      model_id: detail.itemId,
      model_type: detail.modelType,
      detail_type: "ITM",
      quantity: String(detail.quantity),
      price: String(detail.price),
      discount: detail.discount !== undefined ? String(detail.discount) : null,
      weight: detail.weight !== undefined ? String(detail.weight) : null,
      debit: String(debit),
      credit: String(credit),
      sku: detail.sku ?? null,
      name: detail.name ?? null,
      notes: detail.notes ?? null,
    };

    return this.detailInsertableSchema.parse(
      data,
    ) as Insertable<TransactionDetails>;
  }

  /**
   * Transform partial detail data to updateable database row (snake_case, no undefined values)
   */
  detailToUpdateable(
    detail: UpdateTradeDetailProps,
  ): Updateable<TransactionDetails> {
    const data: Record<string, unknown> = {};

    if (detail.modelType !== undefined) {
      data.model_type = detail.modelType;
    }
    if (detail.quantity !== undefined) {
      data.quantity = String(detail.quantity);
      // Recalculate debit/credit when quantity changes
      const quantity = detail.quantity;
      data.debit = String(quantity >= 0 ? quantity : 0);
      data.credit = String(quantity < 0 ? Math.abs(quantity) : 0);
    }
    if (detail.price !== undefined) {
      data.price = String(detail.price);
    }
    if (detail.discount !== undefined) {
      data.discount = String(detail.discount);
    }
    if (detail.weight !== undefined) {
      data.weight = String(detail.weight);
    }
    if (detail.sku !== undefined) {
      data.sku = detail.sku;
    }
    if (detail.name !== undefined) {
      data.name = detail.name;
    }
    if (detail.notes !== undefined) {
      data.notes = detail.notes;
    }

    return this.detailUpdateableSchema.parse(
      data,
    ) as Updateable<TransactionDetails>;
  }
}

export { TradeMapper };
