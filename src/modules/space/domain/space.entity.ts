import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface SpaceEntity extends BaseEntity {
  name: string;
  code: string;
  address: string | null;
  notes: string | null;
}

export type { SpaceEntity };
