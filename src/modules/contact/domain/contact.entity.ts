import type { BaseEntity } from "@/shared/domain/base.entity.ts";
import type { ContactTrade } from "./contact-trade.type.ts";

interface ContactEntity extends BaseEntity {
  name: string;
  email?: string;
  code?: string;
  lastTrade?: ContactTrade;
  notes?: string;
}

export type { ContactEntity };
