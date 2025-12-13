import type { ItemEntity } from "../../domain/item.entity.ts";
import type { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";

/**
 * Valid item fixture with all required fields
 */
const validItem: ItemEntity = {
  id: 1,
  name: "Test Item",
  cost: "10.00",
  price: "15.00",
  weight: "1.50",
  status: "active",
  sku: "TEST-001",
  code: "ITEM-001",
  description: "A test item for unit testing",
  notes: "Test notes",
  space_id: 1,
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
};

/**
 * Item without optional fields
 */
const minimalItem: ItemEntity = {
  id: 2,
  name: "Minimal Item",
  cost: "5.00",
  price: "8.00",
  weight: "0.50",
  status: "active",
};

/**
 * Inactive item fixture
 */
const inactiveItem: ItemEntity = {
  id: 3,
  name: "Inactive Item",
  cost: "20.00",
  price: "30.00",
  weight: "2.00",
  status: "inactive",
  sku: "TEST-002",
};

/**
 * Archived (soft-deleted) item fixture
 */
const archivedItem: ItemEntity = {
  id: 4,
  name: "Archived Item",
  cost: "15.00",
  price: "25.00",
  weight: "1.00",
  status: "archived",
  sku: "TEST-003",
  deleted_at: new Date("2024-01-15T00:00:00Z"),
};

/**
 * List of items for testing getMany operations
 */
const itemsList: ItemEntity[] = [
  validItem,
  minimalItem,
  inactiveItem,
  {
    id: 5,
    name: "Fourth Item",
    cost: "12.50",
    price: "18.75",
    weight: "1.25",
    status: "active",
    sku: "TEST-004",
  },
  {
    id: 6,
    name: "Fifth Item",
    cost: "8.00",
    price: "12.00",
    weight: "0.75",
    status: "active",
    sku: "TEST-005",
  },
];

/**
 * Sample metadata for paginated responses
 */
const sampleMetadata: GetManyMetadataType = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 5,
  totalPages: 1,
};

/**
 * Item data without ID (for create operations)
 */
const createItemData: Omit<ItemEntity, "id"> = {
  name: "New Item",
  cost: "25.00",
  price: "40.00",
  weight: "3.00",
  status: "active",
  sku: "NEW-001",
  description: "A new item to be created",
};

/**
 * Partial item data (for update operations)
 */
const updateItemData: Partial<ItemEntity> = {
  name: "Updated Item Name",
  price: "45.00",
  description: "Updated description",
};

export {
  archivedItem,
  createItemData,
  inactiveItem,
  itemsList,
  minimalItem,
  sampleMetadata,
  updateItemData,
  validItem,
};
