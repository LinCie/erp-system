import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { TradeService } from "../application/trade.service.ts";
import { getManyTradesRoute } from "./routes/get-many-trades.route.ts";
import { getOneTradeRoute } from "./routes/get-one-trade.route.ts";
import { createTradeRoute } from "./routes/create-trade.route.ts";
import { updateTradeRoute } from "./routes/update-trade.route.ts";
import { deleteTradeRoute } from "./routes/delete-trade.route.ts";
import { createTradeDetailRoute } from "./routes/create-trade-detail.route.ts";
import { updateTradeDetailRoute } from "./routes/update-trade-detail.route.ts";
import { deleteTradeDetailRoute } from "./routes/delete-trade-detail.route.ts";
import { lookupRoute } from "./routes/lookup-lookup.route.ts";
import { batchOperationsRoute } from "./routes/batch-operations.route.ts";
import type { BatchOperation } from "../application/batch-operations.type.ts";

function defineTradeController(service: TradeService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getManyTradesRoute, async (c) => {
    const {
      space_id,
      model_type,
      with_details,
      with_players,
      with_children,
      with_parent,
      ...rest
    } = c.req.valid("query");
    const result = await service.getMany({
      ...rest,
      spaceId: space_id,
      modelType: model_type,
      withDetails: with_details,
      withPlayers: with_players,
      withChildren: with_children,
      withParent: with_parent,
    });
    return c.json(result, 200);
  });

  app.openapi(getOneTradeRoute, async (c) => {
    const { id } = c.req.valid("param");
    const {
      with_details,
      with_players,
      with_children,
      with_parent,
    } = c.req.valid("query");
    const result = await service.getOne({
      id,
      withDetails: with_details,
      withPlayers: with_players,
      withChildren: with_children,
      withParent: with_parent,
    });
    return c.json(result, 200);
  });

  app.openapi(createTradeRoute, async (c) => {
    const body = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const data = {
      ...body,
      senderId: parseInt(payload.sub as string, 10),
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

  // Routes for trade detail management
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

  app.openapi(batchOperationsRoute, async (c) => {
    const body = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const senderId = parseInt(payload.sub as string, 10);

    // Inject senderId into create operations
    const operations: BatchOperation[] = body.operations.map((op) => {
      if (op.type === "create") {
        return {
          ...op,
          data: {
            ...op.data,
            senderId,
          },
        } as BatchOperation;
      }
      return op as BatchOperation;
    });

    try {
      const result = await service.executeBatchOperations(operations);
      return c.json(result, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("NOT_FOUND")) {
          return c.json(
            { error: "NOT_FOUND", message: error.message },
            404,
          );
        }
        return c.json(
          { error: "BAD_REQUEST", message: error.message },
          400,
        );
      }
      throw error;
    }
  });

  app.openapi(lookupRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.tradeLookup(
      body.number,
      body.lastFourDigits,
    );
    return c.json(result, 200);
  });

  return app;
}

export { defineTradeController };
