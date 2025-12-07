import { Hono } from "hono";
import { itemController } from "./modules/item/presentation/item.module.ts";
import { createAuthModule } from "./modules/auth/presentation/auth.module.ts";

async function main() {
  const app = new Hono();

  const { authController } = await createAuthModule();

  app.route("/auth", authController);
  app.route("/items", itemController);

  Deno.serve(app.fetch);
}

main();
