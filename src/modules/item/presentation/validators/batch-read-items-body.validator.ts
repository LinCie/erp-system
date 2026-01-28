import { z } from "@hono/zod-openapi";

const batchReadItemsBodySchema = z
  .object({
    ids: z
      .array(z.coerce.number().int().positive())
      .min(1)
      .max(1000)
      .openapi({ example: [1, 2, 3] }),
    spaceId: z.coerce.number().int().positive().optional().openapi({
      example: 1,
    }),
    withInventory: z.boolean().optional().default(false).openapi({
      example: false,
    }),
  })
  .openapi("BatchReadItemsBody");

type BatchReadItemsBody = z.infer<typeof batchReadItemsBodySchema>;

export { batchReadItemsBodySchema };
export type { BatchReadItemsBody };
