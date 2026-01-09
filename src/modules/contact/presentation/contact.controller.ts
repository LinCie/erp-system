import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { ContactService } from "../application/contact.service.ts";
import { getManyContactsRoute } from "./routes/get-many-contacts.route.ts";
import { getOneContactRoute } from "./routes/get-one-contact.route.ts";
import { createContactRoute } from "./routes/create-contact.route.ts";
import { updateContactRoute } from "./routes/update-contact.route.ts";
import { deleteContactRoute } from "./routes/delete-contact.route.ts";

function defineContactController(service: ContactService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getManyContactsRoute, async (c) => {
    const { space_id, with_full_details, ...rest } = c.req.valid("query");
    const result = await service.getMany({
      ...rest,
      spaceId: space_id,
      withFullDetails: with_full_details,
    });
    return c.json(result, 200);
  });

  app.openapi(getOneContactRoute, async (c) => {
    const { id } = c.req.valid("param");
    const result = await service.getOne(id);
    return c.json(result, 200);
  });

  app.openapi(createContactRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.create(body);
    return c.json(result, 201);
  });

  app.openapi(updateContactRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await service.update(id, body);
    return c.json(result, 200);
  });

  app.openapi(deleteContactRoute, async (c) => {
    const { id } = c.req.valid("param");
    await service.delete(id);
    return c.body(null, 204);
  });

  return app;
}

export { defineContactController };
