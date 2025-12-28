import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { InventoryService } from "../application/inventory.service.ts";
import { getManyInventoriesRoute } from "./routes/get-many-inventories.route.ts";
import { getOneInventoryRoute } from "./routes/get-one-inventory.route.ts";
import { getMutationsRoute } from "./routes/get-mutations.route.ts";
import { createInventoryRoute } from "./routes/create-inventory.route.ts";
import { updateInventoryRoute } from "./routes/update-inventory.route.ts";
import { deleteInventoryRoute } from "./routes/delete-inventory.route.ts";

function defineInventoryController(service: InventoryService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getManyInventoriesRoute, async (c) => {
    const query = c.req.valid("query");
    const result = await service.getMany(query);
    return c.json(result, 200);
  });

  app.openapi(getOneInventoryRoute, async (c) => {
    const { id } = c.req.valid("param");
    const result = await service.getOne(id);
    return c.json(result, 200);
  });

  app.openapi(getMutationsRoute, async (c) => {
    const { id } = c.req.valid("param");
    const query = c.req.valid("query");
    const result = await service.getMutations({ inventory_id: id, ...query });
    return c.json(result, 200);
  });

  app.openapi(createInventoryRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.create(body);
    return c.json(result, 201);
  });

  app.openapi(updateInventoryRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await service.update(id, body);
    return c.json(result, 200);
  });

  app.openapi(deleteInventoryRoute, async (c) => {
    const { id } = c.req.valid("param");
    await service.delete(id);
    return c.body(null, 204);
  });

  return app;
}

export { defineInventoryController };
