import { z } from "zod";

const createItemBodySchema = z.object({
  name: z.string(),
  status: z.enum(["active", "inactive"]),
});

type CreateItemBody = z.infer<typeof createItemBodySchema>;

export { createItemBodySchema };
export type { CreateItemBody };
