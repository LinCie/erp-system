import { createRoute } from "@hono/zod-openapi";
import { itemChatBodySchema } from "../validators/itemChatBody.ts";
import { chatResponseSchema } from "../schemas/chat-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const itemChatRoute = createRoute({
  method: "post",
  path: "/chat",
  tags: ["Items"],
  summary: "Chat with AI about items",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: itemChatBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: chatResponseSchema } },
      description: "AI response",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { itemChatRoute };
