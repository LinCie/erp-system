import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { SpaceRepository } from "../infrastructure/space.repository.ts";
import { SpaceMapper } from "../infrastructure/space.mapper.ts";
import { SpaceService } from "../application/space.service.ts";
import { defineSpaceController } from "./space.controller.ts";

const db = getDatabase();

const spaceMapper = new SpaceMapper();
const spaceRepo = new SpaceRepository(db, spaceMapper);
const spaceService = new SpaceService(spaceRepo);
const spaceController = defineSpaceController(spaceService);

export { spaceController };
