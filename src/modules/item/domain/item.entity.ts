import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ItemEntity extends BaseEntity {
  name: string;
}

export type { ItemEntity };
