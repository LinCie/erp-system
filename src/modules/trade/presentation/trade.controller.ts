import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { TradeService } from "../application/trade.service.ts";
import { getManyTradesRoute } from "./routes/get-many-trades.route.ts";
import { getOneTradeRoute } from "./routes/get-one-trade.route.ts";
import { createTradeRoute } from "./routes/create-trade.route.ts";
import { updateTradeRoute } from "./routes/update-trade.route.ts";
import { deleteTradeRoute } from "./routes/delete-trade.route.ts";

function defineTradeController(service: TradeService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getManyTradesRoute, async (c) => {
    const query = c.req.valid("query");
    const result = await service.getMany(query);
    return c.json(result, 200);
  });

  app.openapi(getOneTradeRoute, async (c) => {
    const { id } = c.req.valid("param");
    const result = await service.getOne({ id, withDetails: true });
    return c.json(result, 200);
  });

  app.openapi(createTradeRoute, async (c) => {
    const data = c.req.valid("json");
    const result = await service.create(data);
    return c.json(result, 201);
  });

  app.openapi(updateTradeRoute, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const result = await service.update(id, data);
    return c.json(result, 200);
  });

  app.openapi(deleteTradeRoute, async (c) => {
    const { id } = c.req.valid("param");
    await service.delete(id);
    return c.body(null, 204);
  });

  return app;
}

export { defineTradeController };
