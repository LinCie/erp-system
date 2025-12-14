import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ItemEntity extends BaseEntity {
  name: string;
  cost: string;
  price: string;
  weight: string;
  space_id: number;
  code?: string;
  description?: string;
  sku?: string;
  notes?: string;
}

export type { ItemEntity };
