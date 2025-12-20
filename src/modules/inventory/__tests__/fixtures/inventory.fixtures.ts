import type { InventoryEntity } from "../../domain/inventory.entity.ts";
import type { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";

const validInventory: InventoryEntity = {
  id: 1,
  name: "Test Inventory",
  status: "active",
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
};

const minimalInventory: InventoryEntity = {
  id: 2,
  name: "Minimal Inventory",
  status: "active",
};

const inactiveInventory: InventoryEntity = {
  id: 3,
  name: "Inactive Inventory",
  status: "inactive",
};

const archivedInventory: InventoryEntity = {
  id: 4,
  name: "Archived Inventory",
  status: "archived",
  deleted_at: new Date("2024-01-15T00:00:00Z"),
};

const inventoriesList: InventoryEntity[] = [
  validInventory,
  minimalInventory,
  inactiveInventory,
  { id: 5, name: "Fourth Inventory", status: "active" },
  { id: 6, name: "Fifth Inventory", status: "active" },
];

const sampleMetadata: GetManyMetadataType = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 5,
  totalPages: 1,
};

const createInventoryData: Omit<InventoryEntity, "id"> = {
  name: "New Inventory",
  status: "active",
};

const updateInventoryData: Partial<InventoryEntity> = {
  name: "Updated Inventory Name",
};

export {
  archivedInventory,
  createInventoryData,
  inactiveInventory,
  inventoriesList,
  minimalInventory,
  sampleMetadata,
  updateInventoryData,
  validInventory,
};
