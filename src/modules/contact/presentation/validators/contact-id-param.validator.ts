import { z } from "@hono/zod-openapi";

const contactIdParamSchema = z
  .object({
    id: z.coerce.number().openapi({ param: { name: "id", in: "path" }, example: 1 }),
  })
  .openapi("ContactIdParam");

type ContactIdParams = z.infer<typeof contactIdParamSchema>;

export { contactIdParamSchema };
export type { ContactIdParams };
