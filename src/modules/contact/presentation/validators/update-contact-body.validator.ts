import { z } from "@hono/zod-openapi";
import { createContactBodySchema } from "./create-contact-body.validator.ts";

const updateContactBodySchema = createContactBodySchema.partial().openapi("UpdateContactBody");

type UpdateContactBody = z.infer<typeof updateContactBodySchema>;

export { updateContactBodySchema };
export type { UpdateContactBody };
