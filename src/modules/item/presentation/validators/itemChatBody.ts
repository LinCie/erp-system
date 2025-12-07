import { z } from "@hono/zod-openapi";

const itemChatBodySchema = z
  .object({
    prompt: z.string().openapi({ example: "List all active items" }),
  })
  .openapi("ItemChatBody");

type ItemChatBody = z.infer<typeof itemChatBodySchema>;

export { itemChatBodySchema };
export type { ItemChatBody };
