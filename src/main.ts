import { Hono } from "hono";
import { itemController } from "./modules/item/presentation/item.module.ts";

const app = new Hono();

app.route("/items", itemController);

Deno.serve(app.fetch);
