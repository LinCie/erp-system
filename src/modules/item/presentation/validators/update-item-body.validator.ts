import { z } from "@hono/zod-openapi";
import { createItemBodySchema } from "./create-item-body.validator.ts";

const updateItemBodySchema = createItemBodySchema.partial().openapi(
  "UpdateItemBody",
);

type UpdateItemBody = z.infer<typeof updateItemBodySchema>;

export { updateItemBodySchema };
export type { UpdateItemBody };
