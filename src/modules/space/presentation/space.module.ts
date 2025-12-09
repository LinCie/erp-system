import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { SpaceRepository } from "../infrastructure/space.repository.ts";
import { SpaceService } from "../application/space.service.ts";
import { defineSpaceController } from "./space.controller.ts";

const db = getDatabase();

const spaceRepo = new SpaceRepository(db);
const spaceService = new SpaceService(spaceRepo);
const spaceController = defineSpaceController(spaceService);

export { spaceController };
