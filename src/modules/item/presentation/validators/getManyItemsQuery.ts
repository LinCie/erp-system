import { z } from "zod";

const getManyItemsQuerySchema = z.object({
  spaceId: z.coerce.number(),
  type: z.enum(["full", "partial"]),
  search: z.string().optional(),
  limit: z.coerce.number().positive().optional(),
  page: z.coerce.number().positive().optional(),
});

type GetManyItemsQuery = z.infer<typeof getManyItemsQuerySchema>;

export { getManyItemsQuerySchema };
export type { GetManyItemsQuery };
