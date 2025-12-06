import { z } from "zod";

const itemIdParamSchema = z.object({
  id: z.coerce.number(),
});

type ItemIdParams = z.infer<typeof itemIdParamSchema>;

export { itemIdParamSchema };
export type { ItemIdParams };
