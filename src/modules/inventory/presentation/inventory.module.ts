import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { InventoryRepository } from "../infrastructure/inventory.repository.ts";
import { InventoryService } from "../application/inventory.service.ts";
import { defineInventoryController } from "./inventory.controller.ts";
import { InventoryMapper } from "../infrastructure/inventory.mapper.ts";

const db = getDatabase();

const inventoryMapper = new InventoryMapper();
const inventoryRepo = new InventoryRepository(db, inventoryMapper);
const inventoryService = new InventoryService(inventoryRepo);
const inventoryController = defineInventoryController(inventoryService);

export { inventoryController };
