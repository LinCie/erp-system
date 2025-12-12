import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ItemEntity extends BaseEntity {
  name: string;
  code?: string | null;
  description?: string | null;
  sku?: string | null;
  cost: string;
  price: string;
  weight: string;
  attributes?: Record<string, unknown> | null;
  dimension?: Record<string, unknown> | null;
  images?: Record<string, unknown> | null;
  files?: Record<string, unknown> | null;
  links?: Record<string, unknown> | null;
  options?: Record<string, unknown> | null;
  tags?: Record<string, unknown> | null;
  variants?: Record<string, unknown> | null;
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
