interface InventoryItem {
  id: number;
  balance: number;
  cost_per_unit: number;
  notes?: string;
  space_name: string;
  status: string;
}

export type { InventoryItem };
