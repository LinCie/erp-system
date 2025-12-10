import { z } from "@hono/zod-openapi";

const getManyMetadataSchema = z.object({
  totalItems: z.number().openapi({ example: 100 }),
  totalPages: z.number().openapi({ example: 10 }),
  currentPage: z.number().openapi({ example: 1 }),
  itemsPerPage: z.number().openapi({ example: 10 }),
}).openapi("GetManyMetadata");

export { getManyMetadataSchema };
