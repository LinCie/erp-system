import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { S3StorageService } from "@/shared/infrastructure/storage/index.ts";
import { ItemRepository } from "../infrastructure/item.repository.ts";
import { ItemService } from "../application/item.service.ts";
import { defineItemController } from "./item.controller.ts";
import { ItemAiService } from "../infrastructure/item.ai-service.ts";
import { getGemini } from "../../../shared/infrastructure/ai/index.ts";
import { ItemMapper } from "../infrastructure/item.mapper.ts";

const db = getDatabase();
const gemini = getGemini();

const itemMapper = new ItemMapper();
const itemRepo = new ItemRepository(db, itemMapper);
const storageService = new S3StorageService();
const itemService = new ItemService(itemRepo, storageService);
const itemAiService = new ItemAiService(gemini, itemService);
const itemController = defineItemController(itemService, itemAiService);

export { itemController };
