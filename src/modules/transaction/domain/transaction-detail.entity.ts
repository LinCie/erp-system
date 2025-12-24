import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface TransactionDetailEntity extends BaseEntity {
  // Foreign Key
  transaction_id: number; // Required - foreign key

  // Polymorphic Relationships
  detail_type?: string;
  detail_id?: number;
  model_type?: string;
  model_id?: number;

  // Item Information (denormalized for history)
  sku?: string;
  name?: string;
  code?: string;

  // Quantities and Pricing (decimal fields as strings)
  quantity: string; // Required
  price: string; // Required
  discount: string; // Required
  weight?: string;
  cost_per_unit: string; // Required

  // Accounting (decimal fields as strings)
  debit: string; // Required
  credit: string; // Required

  // Additional Data
  data?: Record<string, unknown>;
  notes?: string;

  // Inherited from BaseEntity: id, status, created_at, updated_at, deleted_at
}

export type { TransactionDetailEntity };
