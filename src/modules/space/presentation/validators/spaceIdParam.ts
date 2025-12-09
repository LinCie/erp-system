import { z } from "@hono/zod-openapi";

const spaceIdParamSchema = z
  .object({
    id: z.coerce.number().openapi({
      param: { name: "id", in: "path" },
      example: 1,
    }),
  })
  .openapi("SpaceIdParam");

type SpaceIdParams = z.infer<typeof spaceIdParamSchema>;

export { spaceIdParamSchema };
export type { SpaceIdParams };
