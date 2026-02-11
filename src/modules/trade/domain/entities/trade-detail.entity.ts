interface TradeItemEntity {
  id: number;
  name: string;
  price: number;
  sku?: string;
}

type TradeDetailEntity = {
  /** Base fields (camelCase to match mapper output) */
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  /** Item Relationship
   *
   * Fetches the item from the model_type if detail_type is 'ITM'
   */
  item?: TradeItemEntity;

  /** Basic info (Required) */
  quantity: number;
  price: number;
  discount: number;
  weight: number;

  /** Calculated info (Readonly) */
  debit: number;
  credit: number;

  /** Additional info */
  notes?: string;
};

export type { TradeDetailEntity };
