import { z } from "@hono/zod-openapi";
import { createItemBodySchema } from "./create-item-body.validator.ts";

const existingImageSchema = z.object({
  name: z.string(),
  path: z.string(),
  size: z.coerce.number(),
});

const updateItemBodySchema = createItemBodySchema.partial().omit({
  space_id: true,
}).extend({
  existing_images: z.array(existingImageSchema).optional().openapi({
    description: "Array of existing images to keep (omit to keep all)",
  }),
}).openapi("UpdateItemBody");

const updateItemFormSchema = updateItemBodySchema.extend({
  images: z
    .union([z.instanceof(File), z.array(z.instanceof(File))])
    .optional()
    .openapi({ type: "string", format: "binary" }),
  existing_images: z
    .string()
    .optional()
    .transform((val) => (val ? JSON.parse(val) : undefined))
    .pipe(z.array(existingImageSchema).optional())
    .openapi({ description: "JSON string of existing images to keep" }),
}).openapi("UpdateItemForm");

type UpdateItemBody = z.infer<typeof updateItemBodySchema>;
type UpdateItemForm = z.infer<typeof updateItemFormSchema>;

export { updateItemBodySchema, updateItemFormSchema };
export type { UpdateItemBody, UpdateItemForm };
