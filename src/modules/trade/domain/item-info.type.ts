/**
 * ItemInfo represents basic item information when joined to trade details.
 * Only populated when detail_type is 'ITM'.
 */
interface ItemInfo {
  id: number;
  name: string;
  sku?: string;
  cost: string;
  price: string;
}

export type { ItemInfo };
