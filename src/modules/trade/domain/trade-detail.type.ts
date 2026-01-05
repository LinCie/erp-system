import type { ItemInfo } from "./item-info.type.ts";

/**
 * TradeDetailType represents a line item within a trade transaction.
 * Contains item information, quantities, pricing, and calculated debit/credit values.
 *
 * All numeric fields (quantity, price, discount, weight, debit, credit) are stored
 * as string representations of decimal numbers for precision.
 */
interface TradeDetailType {
  id: number;
  model_type: string;
  sku?: string;
  name?: string;
  quantity: number;
  price: number;
  discount: number;
  weight: number;
  debit: number;
  credit: number;
  notes?: string;
  /** Item info - only populated when detail_type is 'ITM' */
  item?: ItemInfo;
}

export type { TradeDetailType };
