import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { AuthService } from "../application/auth.service.ts";
import { signupRoute } from "./routes/signup.route.ts";
import { signinRoute } from "./routes/signin.route.ts";
import { signoutRoute } from "./routes/signout.route.ts";
import { refreshRoute } from "./routes/refresh.route.ts";
import { validateRoute } from "./routes/validate.route.ts";

function defineAuthController(service: AuthService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  app.openapi(signupRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.signUp(body);
    return c.json(result, 201);
  });

  app.openapi(signinRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.signIn(body);
    return c.json(result, 200);
  });

  app.openapi(signoutRoute, async (c) => {
    const body = c.req.valid("json");
    await service.signOut(body.refreshToken);
    return c.body(null, 204);
  });

  app.openapi(refreshRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.refresh(body.refreshToken);
    return c.json(result, 200);
  });

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/validate", jwt({ secret: jwtSecret }));

  app.openapi(validateRoute, (c) => {
    return c.json({ valid: true }, 200);
  });

  return app;
}

export { defineAuthController };
