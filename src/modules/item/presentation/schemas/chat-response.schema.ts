import { z } from "@hono/zod-openapi";

const chatResponseSchema = z
  .object({
    response: z.string().openapi({ example: "Here are the active items..." }),
  })
  .openapi("ChatResponse");

export { chatResponseSchema };
