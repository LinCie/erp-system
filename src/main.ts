import { Hono } from "hono";
import { itemController } from "./modules/item/presentation/item.module.ts";
import { authController } from "./modules/auth/presentation/auth.module.ts";

const app = new Hono();

app.route("/auth", authController);

app.route("/items", itemController);

Deno.serve(app.fetch);
