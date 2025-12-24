import type { Insertable, Updateable } from "kysely";
import type { Transactions } from "@/shared/infrastructure/persistence/database.d.ts";
import type { TransactionEntity } from "../domain/transaction.entity.ts";

import { z } from "@hono/zod-openapi";

class TransactionMapper {
  private entitySchema = z.object({
    id: z.number(),
    status: z.enum(["active", "inactive", "archived"]),

    // Identification
    number: z.string().optional(),
    class: z.string().optional(),

    // Polymorphic Relationships
    space_type: z.string().optional(),
    space_id: z.number().optional(),
    model_type: z.string().optional(),
    model_id: z.number().optional(),
    type_type: z.string().optional(),
    type_id: z.number().optional(),

    // Transaction Parties
    sender_type: z.string().optional(),
    sender_id: z.number().optional(),
    receiver_type: z.string().optional(),
    receiver_id: z.number().optional(),
    handler_type: z.string().optional(),
    handler_id: z.number().optional(),

    // Transaction Flow
    input_type: z.string().optional(),
    input_id: z.number().optional(),
    output_type: z.string().optional(),
    output_id: z.number().optional(),
    parent_type: z.string().optional(),
    parent_id: z.number().optional(),
    relation_type: z.string().optional(),
    relation_id: z.number().optional(),

    // Addresses (JSON)
    input_address: z.record(z.string(), z.unknown()).optional(),
    output_address: z.record(z.string(), z.unknown()).optional(),

    // Timestamps
    request_time: z.coerce.date().optional(),
    sent_time: z.coerce.date().optional(),
    received_time: z.coerce.date().optional(),

    // Financial (Decimal as string)
    total: z.string(),
    total_details: z.string().optional(),
    fee: z.string(),
    fee_rules: z.string().optional(),

    // Notes
    description: z.string().optional(),
    sender_notes: z.string().optional(),
    receiver_notes: z.string().optional(),
    handler_notes: z.string().optional(),
    handler_number: z.string().optional(),
    notes: z.string().optional(),

    // Metadata (JSON)
    files: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    links: z.array(z.string()).optional(),

    // BaseEntity fields
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  private insertableSchema = z.object({
    status: z.enum(["active", "inactive", "archived"]),

    // Identification
    number: z.string().nullable(),
    class: z.string().nullable(),

    // Polymorphic Relationships
    space_type: z.string().nullable(),
    space_id: z.number().nullable(),
    model_type: z.string().nullable(),
    model_id: z.number().nullable(),
    type_type: z.string().nullable(),
    type_id: z.number().nullable(),

    // Transaction Parties
    sender_type: z.string().nullable(),
    sender_id: z.number().nullable(),
    receiver_type: z.string().nullable(),
    receiver_id: z.number().nullable(),
    handler_type: z.string().nullable(),
    handler_id: z.number().nullable(),

    // Transaction Flow
    input_type: z.string().nullable(),
    input_id: z.number().nullable(),
    output_type: z.string().nullable(),
    output_id: z.number().nullable(),
    parent_type: z.string().nullable(),
    parent_id: z.number().nullable(),
    relation_type: z.string().nullable(),
    relation_id: z.number().nullable(),

    // Addresses (JSON strings for DB)
    input_address: z.string().nullable(),
    output_address: z.string().nullable(),

    // Timestamps
    request_time: z.date().nullable(),
    sent_time: z.date().nullable(),
    received_time: z.date().nullable(),

    // Financial (Decimal as string)
    total: z.string(),
    total_details: z.string().nullable(),
    fee: z.string(),
    fee_rules: z.string().nullable(),

    // Notes
    description: z.string().nullable(),
    sender_notes: z.string().nullable(),
    receiver_notes: z.string().nullable(),
    handler_notes: z.string().nullable(),
    handler_number: z.string().nullable(),
    notes: z.string().nullable(),

    // Metadata (JSON strings for DB)
    files: z.string().nullable(),
    tags: z.string().nullable(),
    links: z.string().nullable(),
  });

  private updateableSchema = this.insertableSchema.partial();

  toInsertable(entity: TransactionEntity): Insertable<Transactions> {
    const data = {
      status: entity.status,

      // Identification
      number: entity.number ?? null,
      class: entity.class ?? null,

      // Polymorphic Relationships
      space_type: entity.space_type ?? null,
      space_id: entity.space_id ?? null,
      model_type: entity.model_type ?? null,
      model_id: entity.model_id ?? null,
      type_type: entity.type_type ?? null,
      type_id: entity.type_id ?? null,

      // Transaction Parties
      sender_type: entity.sender_type ?? null,
      sender_id: entity.sender_id ?? null,
      receiver_type: entity.receiver_type ?? null,
      receiver_id: entity.receiver_id ?? null,
      handler_type: entity.handler_type ?? null,
      handler_id: entity.handler_id ?? null,

      // Transaction Flow
      input_type: entity.input_type ?? null,
      input_id: entity.input_id ?? null,
      output_type: entity.output_type ?? null,
      output_id: entity.output_id ?? null,
      parent_type: entity.parent_type ?? null,
      parent_id: entity.parent_id ?? null,
      relation_type: entity.relation_type ?? null,
      relation_id: entity.relation_id ?? null,

      // Addresses (JSON objects → strings)
      input_address: entity.input_address
        ? JSON.stringify(entity.input_address)
        : null,
      output_address: entity.output_address
        ? JSON.stringify(entity.output_address)
        : null,

      // Timestamps
      request_time: entity.request_time ?? null,
      sent_time: entity.sent_time ?? null,
      received_time: entity.received_time ?? null,

      // Financial
      total: entity.total,
      total_details: entity.total_details ?? null,
      fee: entity.fee,
      fee_rules: entity.fee_rules ?? null,

      // Notes
      description: entity.description ?? null,
      sender_notes: entity.sender_notes ?? null,
      receiver_notes: entity.receiver_notes ?? null,
      handler_notes: entity.handler_notes ?? null,
      handler_number: entity.handler_number ?? null,
      notes: entity.notes ?? null,

      // Metadata (arrays → JSON strings)
      files: entity.files ? JSON.stringify(entity.files) : null,
      tags: entity.tags ? JSON.stringify(entity.tags) : null,
      links: entity.links ? JSON.stringify(entity.links) : null,
    };
    return this.insertableSchema.parse(data);
  }

  toUpdateable(entity: Partial<TransactionEntity>): Updateable<Transactions> {
    const data: Record<string, unknown> = {};

    if (entity.status !== undefined) data.status = entity.status;

    // Identification
    if (entity.number !== undefined) data.number = entity.number ?? null;
    if (entity.class !== undefined) data.class = entity.class ?? null;

    // Polymorphic Relationships
    if (entity.space_type !== undefined) {
      data.space_type = entity.space_type ?? null;
    }
    if (entity.space_id !== undefined) data.space_id = entity.space_id ?? null;
    if (entity.model_type !== undefined) {
      data.model_type = entity.model_type ?? null;
    }
    if (entity.model_id !== undefined) data.model_id = entity.model_id ?? null;
    if (entity.type_type !== undefined) {
      data.type_type = entity.type_type ?? null;
    }
    if (entity.type_id !== undefined) data.type_id = entity.type_id ?? null;

    // Transaction Parties
    if (entity.sender_type !== undefined) {
      data.sender_type = entity.sender_type ?? null;
    }
    if (entity.sender_id !== undefined) {
      data.sender_id = entity.sender_id ?? null;
    }
    if (entity.receiver_type !== undefined) {
      data.receiver_type = entity.receiver_type ?? null;
    }
    if (entity.receiver_id !== undefined) {
      data.receiver_id = entity.receiver_id ?? null;
    }
    if (entity.handler_type !== undefined) {
      data.handler_type = entity.handler_type ?? null;
    }
    if (entity.handler_id !== undefined) {
      data.handler_id = entity.handler_id ?? null;
    }

    // Transaction Flow
    if (entity.input_type !== undefined) {
      data.input_type = entity.input_type ?? null;
    }
    if (entity.input_id !== undefined) data.input_id = entity.input_id ?? null;
    if (entity.output_type !== undefined) {
      data.output_type = entity.output_type ?? null;
    }
    if (entity.output_id !== undefined) {
      data.output_id = entity.output_id ?? null;
    }
    if (entity.parent_type !== undefined) {
      data.parent_type = entity.parent_type ?? null;
    }
    if (entity.parent_id !== undefined) {
      data.parent_id = entity.parent_id ?? null;
    }
    if (entity.relation_type !== undefined) {
      data.relation_type = entity.relation_type ?? null;
    }
    if (entity.relation_id !== undefined) {
      data.relation_id = entity.relation_id ?? null;
    }

    // Addresses
    if (entity.input_address !== undefined) {
      data.input_address = entity.input_address
        ? JSON.stringify(entity.input_address)
        : null;
    }
    if (entity.output_address !== undefined) {
      data.output_address = entity.output_address
        ? JSON.stringify(entity.output_address)
        : null;
    }

    // Timestamps
    if (entity.request_time !== undefined) {
      data.request_time = entity.request_time ?? null;
    }
    if (entity.sent_time !== undefined) {
      data.sent_time = entity.sent_time ?? null;
    }
    if (entity.received_time !== undefined) {
      data.received_time = entity.received_time ?? null;
    }

    // Financial
    if (entity.total !== undefined) data.total = entity.total;
    if (entity.total_details !== undefined) {
      data.total_details = entity.total_details ?? null;
    }
    if (entity.fee !== undefined) data.fee = entity.fee;
    if (entity.fee_rules !== undefined) {
      data.fee_rules = entity.fee_rules ?? null;
    }

    // Notes
    if (entity.description !== undefined) {
      data.description = entity.description ?? null;
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
    if (entity.handler_number !== undefined) {
      data.handler_number = entity.handler_number ?? null;
    }
    if (entity.notes !== undefined) data.notes = entity.notes ?? null;

    // Metadata
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

  toEntity(row: Record<string, unknown>): TransactionEntity {
    // Helper to parse JSON fields
    const parseJson = (value: unknown): unknown => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return undefined;
        }
      }
      return value;
    };

    const data = {
      id: row.id,
      status: row.status,

      // Identification
      number: row.number ?? undefined,
      class: row.class ?? undefined,

      // Polymorphic Relationships
      space_type: row.space_type ?? undefined,
      space_id: row.space_id ?? undefined,
      model_type: row.model_type ?? undefined,
      model_id: row.model_id ?? undefined,
      type_type: row.type_type ?? undefined,
      type_id: row.type_id ?? undefined,

      // Transaction Parties
      sender_type: row.sender_type ?? undefined,
      sender_id: row.sender_id ?? undefined,
      receiver_type: row.receiver_type ?? undefined,
      receiver_id: row.receiver_id ?? undefined,
      handler_type: row.handler_type ?? undefined,
      handler_id: row.handler_id ?? undefined,

      // Transaction Flow
      input_type: row.input_type ?? undefined,
      input_id: row.input_id ?? undefined,
      output_type: row.output_type ?? undefined,
      output_id: row.output_id ?? undefined,
      parent_type: row.parent_type ?? undefined,
      parent_id: row.parent_id ?? undefined,
      relation_type: row.relation_type ?? undefined,
      relation_id: row.relation_id ?? undefined,

      // Addresses (JSON strings → objects)
      input_address: parseJson(row.input_address) as
        | Record<string, unknown>
        | undefined,
      output_address: parseJson(row.output_address) as
        | Record<string, unknown>
        | undefined,

      // Timestamps
      request_time: row.request_time
        ? new Date(row.request_time as string | Date)
        : undefined,
      sent_time: row.sent_time
        ? new Date(row.sent_time as string | Date)
        : undefined,
      received_time: row.received_time
        ? new Date(row.received_time as string | Date)
        : undefined,

      // Financial
      total: row.total as string,
      total_details: row.total_details ?? undefined,
      fee: row.fee as string,
      fee_rules: row.fee_rules ?? undefined,

      // Notes
      description: row.description ?? undefined,
      sender_notes: row.sender_notes ?? undefined,
      receiver_notes: row.receiver_notes ?? undefined,
      handler_notes: row.handler_notes ?? undefined,
      handler_number: row.handler_number ?? undefined,
      notes: row.notes ?? undefined,

      // Metadata (JSON strings → arrays)
      files: parseJson(row.files) as string[] | undefined,
      tags: parseJson(row.tags) as string[] | undefined,
      links: parseJson(row.links) as string[] | undefined,

      // BaseEntity fields
      created_at: row.created_at
        ? new Date(row.created_at as string | Date)
        : undefined,
      updated_at: row.updated_at
        ? new Date(row.updated_at as string | Date)
        : undefined,
      deleted_at: row.deleted_at
        ? new Date(row.deleted_at as string | Date)
        : undefined,
    };

    return this.entitySchema.parse(data);
  }
}

export { TransactionMapper };
