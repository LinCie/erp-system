/**
 * Detail input for update operation
 * Excludes calculated fields (id, debit, credit) which are set by repository
 */
type CreateTradeDetailProps = {
  itemId: number;
  modelType: string;
  quantity: number;
  price: number;
  discount?: number;
  weight?: number;
  sku?: string;
  name?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type { CreateTradeDetailProps };
