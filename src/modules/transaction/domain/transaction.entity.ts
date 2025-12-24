import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface TransactionEntity extends Omit<BaseEntity, "status"> {
  // Status override for transaction-specific values
  status: string; // TX_DRAFT, TX_SENT, TX_RECEIVED, TX_CLOSED, etc.

  // Identification
  number?: string;
  class?: string;

  // Polymorphic Relationships (type + id pattern)
  space_type?: string;
  space_id?: number;
  model_type?: string;
  model_id?: number;
  type_type?: string;
  type_id?: number;

  // Transaction Parties
  sender_type?: string;
  sender_id?: number;
  receiver_type?: string;
  receiver_id?: number;
  handler_type?: string;
  handler_id?: number;

  // Transaction Flow
  input_type?: string;
  input_id?: number;
  output_type?: string;
  output_id?: number;
  parent_type?: string;
  parent_id?: number;
  relation_type?: string;
  relation_id?: number;

  // Addresses (JSON)
  input_address?: Record<string, unknown>;
  output_address?: Record<string, unknown>;

  // Timestamps
  request_time?: Date;
  sent_time?: Date;
  received_time?: Date;

  // Financial (Decimal as string)
  total: string; // Required
  total_details?: string;
  fee: string; // Required
  fee_rules?: string;

  // Notes
  description?: string;
  sender_notes?: string;
  receiver_notes?: string;
  handler_notes?: string;
  handler_number?: string;
  notes?: string;

  // Metadata (JSON)
  files?: string[];
  tags?: string[];
  links?: string[];

  // Inherited from BaseEntity: id, status, created_at, updated_at, deleted_at
}

export type { TransactionEntity };
