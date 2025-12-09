import { z } from "@hono/zod-openapi";
import { createSpaceBodySchema } from "./createSpaceBody.ts";

const updateSpaceBodySchema = createSpaceBodySchema.partial().openapi(
  "UpdateSpaceBody",
);

type UpdateSpaceBody = z.infer<typeof updateSpaceBodySchema>;

export { updateSpaceBodySchema };
export type { UpdateSpaceBody };
