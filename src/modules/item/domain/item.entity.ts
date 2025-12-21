import type { BaseEntity } from "@/shared/domain/base.entity.ts";
import type { FileType } from "@/shared/domain/types/file.type.ts";
import { InventoryItem } from "./inventory-item.type.ts";

interface ItemImage extends FileType {
  isNew?: boolean;
}

interface ItemEntity extends BaseEntity {
  name: string;
  cost: string;
  price: string;
  weight: string;
  space_id: number;
  inventories?: InventoryItem[];
  files?: FileType[];
  price_discount?: string;
  images?: ItemImage[];
  code?: string;
  description?: string;
  sku?: string;
  notes?: string;
}

export type { ItemEntity, ItemImage };
