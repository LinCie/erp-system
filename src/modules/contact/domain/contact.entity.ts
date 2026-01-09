import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ContactEntity extends Omit<BaseEntity, "status"> {
  name: string;
  email?: string;
}

export type { ContactEntity };
