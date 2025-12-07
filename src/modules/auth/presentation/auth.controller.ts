import { Hono } from "hono";
import { AuthService } from "../application/auth.service.ts";
import { signupBodySchema } from "./validators/signupBody.ts";
import { signinBodySchema } from "./validators/signinBody.ts";
import { signoutBodySchema } from "./validators/signoutBody.ts";
import { refreshBodySchema } from "./validators/refreshBody.ts";

function defineAuthController(service: AuthService) {
  const app = new Hono();

  /**
   * Sign Up Route
   */
  app
    .post("/signup", async (c) => {
      const body = await c.req.json();
      const validatedBody = signupBodySchema.safeParse(body);

      if (!validatedBody.success) {
        return c.json({
          message: "invalid body",
          issues: validatedBody.error.issues,
        }, 400);
      }

      const result = await service.signUp(validatedBody.data);
      return c.json(result, 201);
    });

  /**
   * Sign In Route
   */
  app
    .post("/signin", async (c) => {
      const body = await c.req.json();
      const validatedBody = signinBodySchema.safeParse(body);

      if (!validatedBody.success) {
        return c.json({
          message: "invalid body",
          issues: validatedBody.error.issues,
        }, 400);
      }

      const result = await service.signIn(validatedBody.data);
      return c.json(result);
    });

  /**
   * Sign Out Route
   */
  app
    .post("/signout", async (c) => {
      const body = await c.req.json();
      const validatedBody = signoutBodySchema.safeParse(body);

      if (!validatedBody.success) {
        return c.json({
          message: "invalid body",
          issues: validatedBody.error.issues,
        }, 400);
      }

      await service.signOut(validatedBody.data.refreshToken);
      return c.status(204);
    });

  /**
   * Refresh Token Route
   */
  app
    .post("/refresh", async (c) => {
      const body = await c.req.json();
      const validatedBody = refreshBodySchema.safeParse(body);

      if (!validatedBody.success) {
        return c.json({
          message: "invalid body",
          issues: validatedBody.error.issues,
        }, 400);
      }

      const result = await service.refresh(validatedBody.data.refreshToken);
      return c.json(result);
    });

  return app;
}

export { defineAuthController };
