import { z } from "zod";

const itemChatBodySchema = z.object({
  prompt: z.string(),
});

type ItemChatBody = z.infer<typeof itemChatBodySchema>;

export { itemChatBodySchema };
export type { ItemChatBody };
