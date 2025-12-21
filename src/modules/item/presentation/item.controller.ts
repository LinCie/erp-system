import type { JwtVariables } from "hono/jwt";
import type { FileUploadRequestResult } from "@/shared/application/storage.interface.ts";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { ItemService } from "../application/item.service.ts";
import { ItemAiService } from "../infrastructure/item.ai-service.ts";
import { getManyItemsRoute } from "./routes/get-many-items.route.ts";
import { getOneItemRoute } from "./routes/get-one-item.route.ts";
import { createItemRoute } from "./routes/create-item.route.ts";
import { updateItemRoute } from "./routes/update-item.route.ts";
import { deleteItemRoute } from "./routes/delete-item.route.ts";
import { itemChatRoute } from "./routes/item-chat.route.ts";
import { requestUploadRoute } from "./routes/request-upload.route.ts";

function defineItemController(service: ItemService, aiService: ItemAiService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getManyItemsRoute, async (c) => {
    const query = c.req.valid("query");
    const result = await service.getMany(query);
    return c.json(result, 200);
  });

  app.openapi(getOneItemRoute, async (c) => {
    const { id } = c.req.valid("param");
    const query = c.req.valid("query");
    const result = await service.getOne({ id, ...query });
    return c.json(result, 200);
  });

  app.openapi(createItemRoute, async (c) => {
    const data = c.req.valid("json");
    const result = await service.create(data);
    return c.json(result, 201);
  });

  app.openapi(updateItemRoute, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const result = await service.update(id, data);
    return c.json(result, 200);
  });

  app.openapi(deleteItemRoute, async (c) => {
    const { id } = c.req.valid("param");
    await service.delete(id);
    return c.body(null, 204);
  });

  app.openapi(itemChatRoute, async (c) => {
    const body = c.req.valid("json");
    const response = await aiService.generate(1, body.prompt);
    return c.json({ response }, 200);
  });

  app.openapi(requestUploadRoute, async (c) => {
    const body = c.req.valid("json");

    let result: FileUploadRequestResult;
    if (body.contentType.startsWith("image/")) {
      result = await service.requestImageUpload(body);
    } else {
      result = await service.requestFileUpload(body);
    }

    return c.json(result, 200);
  });

  return app;
}

export { defineItemController };
