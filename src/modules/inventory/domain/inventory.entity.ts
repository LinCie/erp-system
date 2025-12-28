import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface InventoryMutation {
  id: number;
  transaction_id: number;
  sent_time?: Date;
  number?: string;
  sender_notes?: string;
  handler_notes?: string;
  notes?: string;
  model_type?: string;
  cost_per_unit: string;
  debit: string;
  credit: string;
}

interface InventoryEntity extends BaseEntity {
  name: string;
}

export type { InventoryEntity, InventoryMutation };
