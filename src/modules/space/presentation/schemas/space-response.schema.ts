import { z } from "@hono/zod-openapi";

const spaceResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My Space" }),
    status: z.string().openapi({ example: "active" }),
    created_at: z.string().datetime().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
    updated_at: z.string().datetime().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
  })
  .openapi("SpaceResponse");

const spaceListResponseSchema = z.array(spaceResponseSchema).openapi(
  "SpaceListResponse",
);

export { spaceListResponseSchema, spaceResponseSchema };
