import { z } from "@hono/zod-openapi";

const getManySpacesQuerySchema = z
  .object({
    status: z.enum(["active", "inactive", "archived"]).optional().openapi({
      example: "active",
    }),
    limit: z.coerce.number().positive().optional().openapi({ example: 10 }),
    page: z.coerce.number().positive().optional().openapi({ example: 1 }),
  })
  .openapi("GetManySpacesQuery");

type GetManySpacesQuery = z.infer<typeof getManySpacesQuerySchema>;

export { getManySpacesQuerySchema };
export type { GetManySpacesQuery };
