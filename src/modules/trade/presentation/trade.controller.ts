import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { TradeService } from "../application/trade.service.ts";
import { getManyTradesRoute } from "./routes/get-many-trades.route.ts";
import { getOneTradeRoute } from "./routes/get-one-trade.route.ts";
import { createTradeRoute } from "./routes/create-trade.route.ts";
import { updateTradeRoute } from "./routes/update-trade.route.ts";
import { deleteTradeRoute } from "./routes/delete-trade.route.ts";
import { updateTradeTransactionRoute } from "./routes/update-trade-transaction.route.ts";
import { createTradeDetailRoute } from "./routes/create-trade-detail.route.ts";
import { updateTradeDetailRoute } from "./routes/update-trade-detail.route.ts";
import { deleteTradeDetailRoute } from "./routes/delete-trade-detail.route.ts";

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
    const { withDetails, withPlayers, withChildren } = c.req.valid("query");
    const result = await service.getOne({ 
      id, 
      withDetails: withDetails ?? true, // Default to true if not specified, preserving existing behavior
      withPlayers,
      withChildren 
    });
    return c.json(result, 200);
  });

  app.openapi(createTradeRoute, async (c) => {
    const body = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const data = {
      ...body,
      sender_id: parseInt(payload.sub),
    };
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

  // New routes for trade transaction and detail separation
  app.openapi(updateTradeTransactionRoute, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    // Reject if details field is present
    if ("details" in data) {
      return c.json(
        {
          error: "BAD_REQUEST",
          message:
            "Details field is not allowed in this endpoint. Use POST /trades/{id}/details to manage details.",
        },
        400,
      );
    }

    const result = await service.updateTransaction(id, data);
    return c.json(result, 200);
  });

  app.openapi(createTradeDetailRoute, async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const result = await service.createDetail(id, data);
    return c.json(result, 201);
  });

  app.openapi(updateTradeDetailRoute, async (c) => {
    const { id, detailId } = c.req.valid("param");
    const data = c.req.valid("json");
    const result = await service.updateDetail(id, detailId, data);
    return c.json(result, 200);
  });

  app.openapi(deleteTradeDetailRoute, async (c) => {
    const { id, detailId } = c.req.valid("param");
    await service.deleteDetail(id, detailId);
    return c.body(null, 204);
  });

  return app;
}

export { defineTradeController };
