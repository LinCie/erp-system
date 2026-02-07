import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";

const contactResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "John Doe" }),
    email: z.string().optional().openapi({ example: "john@example.com" }),
    last_trade: z
      .object({
        id: z.number().openapi({ example: 1 }),
        number: z.string().openapi({ example: "123456" }),
      })
      .optional(),
    code: z.string().optional().openapi({ example: "123456" }),
    notes: z.string().optional().openapi({ example: "Notes" }),
    status: z.string().optional().openapi({ example: "active" }),
  })
  .openapi("ContactResponse");

const getManyContactsResponseSchema = z.object({
  data: z.array(contactResponseSchema),
  metadata: getManyMetadataSchema,
}).openapi("GetManyContactsResponse");

export { contactResponseSchema, getManyContactsResponseSchema };
