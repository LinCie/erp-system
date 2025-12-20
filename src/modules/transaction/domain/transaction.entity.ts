import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface TransactionEntity extends BaseEntity {
  name: string;
}

export type { TransactionEntity };
