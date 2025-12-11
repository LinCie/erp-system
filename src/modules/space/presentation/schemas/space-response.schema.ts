import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";

const spaceResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My Space" }),
    code: z.string().openapi({ example: "space-code" }),
    status: z.string().openapi({ example: "active" }),
    created_at: z.string().datetime().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
    updated_at: z.string().datetime().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
  })
  .openapi("SpaceResponse");

const spaceListResponseSchema = z.object({
  data: z.array(spaceResponseSchema),
  metadata: getManyMetadataSchema,
})
  .openapi(
    "SpaceListResponse",
  );

export { spaceListResponseSchema, spaceResponseSchema };
