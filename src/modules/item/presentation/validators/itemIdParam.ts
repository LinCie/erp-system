import { z } from "@hono/zod-openapi";

const itemIdParamSchema = z
  .object({
    id: z.coerce.number().openapi({
      param: { name: "id", in: "path" },
      example: 1,
    }),
  })
  .openapi("ItemIdParam");

type ItemIdParams = z.infer<typeof itemIdParamSchema>;

export { itemIdParamSchema };
export type { ItemIdParams };
