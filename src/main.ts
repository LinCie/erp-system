import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { itemController } from "./modules/item/presentation/item.module.ts";
import { createAuthModule } from "./modules/auth/presentation/auth.module.ts";
import { spaceController } from "./modules/space/presentation/space.module.ts";

async function main() {
  const app = new OpenAPIHono();

  const { authController } = await createAuthModule();

  app.route("/auth", authController);
  app.route("/items", itemController);
  app.route("/spaces", spaceController);

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
