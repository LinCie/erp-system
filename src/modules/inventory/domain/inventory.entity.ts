import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface InventoryEntity extends BaseEntity {
  name: string;
}

export type { InventoryEntity };
