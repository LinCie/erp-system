import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { TransactionService } from "../application/transaction.service.ts";
import { getManyTransactionsRoute } from "./routes/get-many-transactions.route.ts";
import { getOneTransactionRoute } from "./routes/get-one-transaction.route.ts";
import { createTransactionRoute } from "./routes/create-transaction.route.ts";
import { updateTransactionRoute } from "./routes/update-transaction.route.ts";
import { updateTransactionWithDetailsRoute } from "./routes/update-transaction-with-details.route.ts";
import { deleteTransactionRoute } from "./routes/delete-transaction.route.ts";

function defineTransactionController(service: TransactionService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getManyTransactionsRoute, async (c) => {
    const query = c.req.valid("query");
    const result = await service.getMany(query);
    return c.json(result, 200);
  });

  app.openapi(getOneTransactionRoute, async (c) => {
    const { id } = c.req.valid("param");
    const query = c.req.valid("query");
    const includeDetails = query.includeDetails ?? false;
    const result = await service.getOne(id, includeDetails);
    return c.json(result, 200);
  });

  app.openapi(createTransactionRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.create({
      ...body,
      status: body.status ?? "active",
    });
    return c.json(result, 201);
  });

  app.openapi(updateTransactionRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await service.update(id, body);
    return c.json(result, 200);
  });

  app.openapi(updateTransactionWithDetailsRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    try {
      const detailsWithStatus = body.details.map((detail) => ({
        ...detail,
        status: detail.status ?? "active" as const,
      }));
      const result = await service.updateWithDetails(
        id,
        body.transaction,
        detailsWithStatus,
      );
      return c.json(result, 200);
    } catch (error) {
      if (error instanceof Error && error.message === "TRANSACTION_CLOSED") {
        return c.json({ message: "Cannot modify closed transaction" }, 400);
      }
      throw error;
    }
  });

  app.openapi(deleteTransactionRoute, async (c) => {
    const { id } = c.req.valid("param");
    await service.delete(id);
    return c.body(null, 204);
  });

  return app;
}

export { defineTransactionController };
