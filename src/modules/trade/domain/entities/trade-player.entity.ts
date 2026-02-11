import type { BaseEntity } from "@/shared/domain/base.entity.ts";

/**
 * TradePlayer represents minimal player data for trade relationships.
 * Used for sender, receiver, and handler references in trades.
 */
type TradePlayer = Omit<BaseEntity, "status"> & {
  code?: string;
  name: string;
};

export type { TradePlayer };
