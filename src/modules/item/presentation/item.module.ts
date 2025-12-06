import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { ItemRepository } from "../infrastructure/item.repository.ts";
import { ItemService } from "../application/item.service.ts";
import { defineItemController } from "./item.controller.ts";
import { ItemAiService } from "../infrastructure/item.ai-service.ts";
import { getGemini } from "../../../shared/infrastructure/ai/index.ts";

const db = getDatabase();
const gemini = getGemini();

const itemRepo = new ItemRepository(db);
const itemService = new ItemService(itemRepo);
const itemAiService = new ItemAiService(gemini, itemService);
const itemController = defineItemController(itemService, itemAiService);

export { itemController };
