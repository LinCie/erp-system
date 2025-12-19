import { z } from "@hono/zod-openapi";
import { createItemBodySchema } from "./create-item-body.validator.ts";

const updateItemBodySchema = createItemBodySchema.partial().omit({
  space_id: true,
});

type UpdateItemBody = z.infer<typeof updateItemBodySchema>;

export { updateItemBodySchema };
export type { UpdateItemBody };
