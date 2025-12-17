import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ItemImage {
  name: string;
  path: string;
  size: number;
  isNew?: boolean;
}

interface ItemEntity extends BaseEntity {
  name: string;
  cost: string;
  price: string;
  weight: string;
  space_id: number;
  images?: ItemImage[];
  code?: string;
  description?: string;
  sku?: string;
  notes?: string;
}

export type { ItemEntity, ItemImage };
