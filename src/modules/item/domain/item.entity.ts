import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ItemEntity extends BaseEntity {
  name: string;
  code?: string;
  description?: string;
  sku?: string;
  cost: string;
  price: string;
  weight: string;
  notes?: string;
  model_id?: number;
  model_type?: string;
  parent_id?: number;
  parent_type?: string;
  space_id?: number;
  space_type?: string;
  type_id?: number;
  type_type?: string;
  primary_code?: string;
}

export type { ItemEntity };
