import "@/shared/infrastructure/logging/index.ts";

import * as Sentry from "@sentry/node";
import { logger } from "hono/logger";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { createAuthModule } from "./modules/auth/presentation/auth.module.ts";
import { contactController } from "./modules/contact/presentation/contact.module.ts";
import { inventoryController } from "./modules/inventory/presentation/inventory.module.ts";
import { itemController } from "./modules/item/presentation/item.module.ts";
import { spaceController } from "./modules/space/presentation/space.module.ts";
import { tradeController } from "./modules/trade/presentation/trade.module.ts";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/presentation/middlewares/index.ts";

async function main() {
  const app = new OpenAPIHono();

  app.onError(errorHandler);
  app.notFound(notFoundHandler);
  app.use(logger());

  const { authController } = await createAuthModule();

  app.route("/auth", authController);
  app.route("/items", itemController);
  app.route("/inventories", inventoryController);
  app.route("/spaces", spaceController);
  app.route("/trades", tradeController);
  app.route("/contacts", contactController);

  // OpenAPI JSON spec endpoint
  app.doc("/doc", {
    openapi: "3.1.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
    },
  });

  // Swagger UI endpoint
  app.get("/swagger", swaggerUI({ url: "/doc" }));

  Deno.serve(app.fetch);
}

main();
