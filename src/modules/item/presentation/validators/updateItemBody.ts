import { z } from "zod";
import { createItemBodySchema } from "./createItemBody.ts";

const updateItemBodySchema = createItemBodySchema.partial();

type UpdateItemBody = z.infer<typeof updateItemBodySchema>;

export { updateItemBodySchema };
export type { UpdateItemBody };
