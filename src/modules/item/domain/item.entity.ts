import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ItemEntity extends BaseEntity {
  name: string;
  code?: string | null;
  description?: string | null;
  sku?: string | null;
  cost: string;
  price: string;
  weight: string;
  notes?: string | null;
  model_id?: number | null;
  model_type?: string | null;
  parent_id?: number | null;
  parent_type?: string | null;
  space_id?: number | null;
  space_type?: string | null;
  type_id?: number | null;
  type_type?: string | null;
  primary_code?: string | null;
}

export type { ItemEntity };
