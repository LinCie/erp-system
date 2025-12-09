import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { SpaceService } from "../application/space.service.ts";
import { getManySpacesRoute } from "./routes/get-many-spaces.route.ts";
import { getOneSpaceRoute } from "./routes/get-one-space.route.ts";
import { createSpaceRoute } from "./routes/create-space.route.ts";
import { updateSpaceRoute } from "./routes/update-space.route.ts";
import { deleteSpaceRoute } from "./routes/delete-space.route.ts";

function defineSpaceController(service: SpaceService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getManySpacesRoute, async (c) => {
    const payload = c.get("jwtPayload") as { sub: string };
    const query = c.req.valid("query");
    const result = await service.getMany({ ...query, userId: +payload.sub });
    return c.json(result, 200);
  });

  app.openapi(getOneSpaceRoute, async (c) => {
    const { id } = c.req.valid("param");
    const result = await service.getOne(id);
    return c.json(result, 200);
  });

  app.openapi(createSpaceRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.create(body);
    return c.json(result, 201);
  });

  app.openapi(updateSpaceRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await service.update(id, body);
    return c.json(result, 200);
  });

  app.openapi(deleteSpaceRoute, async (c) => {
    const { id } = c.req.valid("param");
    await service.delete(id);
    return c.body(null, 204);
  });

  return app;
}

export { defineSpaceController };
