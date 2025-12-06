import { Hono } from "hono";
import { ItemService } from "../application/item.service.ts";
import { getManyItemsQuerySchema } from "./validators/getManyItemsQuery.ts";
import { createItemBodySchema } from "./validators/createItemBody.ts";
import { updateItemBodySchema } from "./validators/updateItemBody.ts";
import { itemIdParamSchema } from "./validators/itemIdParam.ts";
import { ItemAiService } from "../infrastructure/item.ai-service.ts";
import { itemChatBodySchema } from "./validators/itemChatBody.ts";

function defineItemController(service: ItemService, aiService: ItemAiService) {
  const app = new Hono();

  /**
   * Get Many Items Route
   */
  app
    .get("/", async (c) => {
      const query = c.req.query();
      const validatedQuery = getManyItemsQuerySchema.safeParse(query);

      if (!validatedQuery.success) {
        return c.json({
          message: "invalid query",
          issues: validatedQuery.error.issues,
        }, 400);
      }

      const result = await service.getMany(validatedQuery.data);
      return c.json(result);
    });

  /**
   * Get One Item Route
   */
  app
    .get("/:id", async (c) => {
      const param = c.req.query();
      const validatedParam = itemIdParamSchema.safeParse(param);

      if (!validatedParam.success) {
        return c.json({
          message: "invalid param",
          issues: validatedParam.error.issues,
        }, 400);
      }

      const result = await service.getOne(validatedParam.data.id);
      return c.json(result);
    });

  /**
   * Create Item Route
   */
  app
    .post("/", async (c) => {
      const body = await c.req.json();
      const validatedBody = createItemBodySchema.safeParse(body);

      if (!validatedBody.success) {
        return c.json({
          message: "invalid body",
          issues: validatedBody.error.issues,
        }, 400);
      }

      const result = await service.create(validatedBody.data);
      return c.json(result, 201);
    });

  /**
   * Update Item Route
   */
  app
    .patch("/:id", async (c) => {
      const param = c.req.param();
      const validatedParam = itemIdParamSchema.safeParse(param);

      if (!validatedParam.success) {
        return c.json({
          message: "invalid param",
          issues: validatedParam.error.issues,
        }, 400);
      }

      const body = await c.req.json();
      const validatedBody = updateItemBodySchema.safeParse(body);

      if (!validatedBody.success) {
        return c.json({
          message: "invalid body",
          issues: validatedBody.error.issues,
        }, 400);
      }

      const result = await service.update(
        validatedParam.data.id,
        validatedBody.data,
      );
      return c.json(result);
    });

  /**
   * Delete Item Route
   */
  app
    .delete("/:id", async (c) => {
      const param = c.req.param();
      const validatedParam = itemIdParamSchema.safeParse(param);

      if (!validatedParam.success) {
        return c.json({
          message: "invalid param",
          issues: validatedParam.error.issues,
        }, 400);
      }

      await service.delete(validatedParam.data.id);
      return c.status(204);
    });

  /**
   * Item AI Chat Route
   */
  app
    .post("/chat", async (c) => {
      const body = await c.req.json();
      const validatedBody = itemChatBodySchema.safeParse(body);

      if (!validatedBody.success) {
        return c.json({
          message: "invalid body",
          issues: validatedBody.error.issues,
        }, 400);
      }

      const response = await aiService.generate(1, validatedBody.data.prompt);
      return c.json({ response });
    });

  return app;
}

export { defineItemController };
