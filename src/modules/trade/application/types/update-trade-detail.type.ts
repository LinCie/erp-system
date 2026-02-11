import type { CreateTradeDetailProps } from "./create-trade-detail.type.ts";

/**
 * Data for updating a trade detail (excludes immutable linking fields)
 */
type UpdateTradeDetailProps = Partial<
  Omit<CreateTradeDetailProps, "itemId">
>;

export type { UpdateTradeDetailProps };
