import type { Context, NotFoundHandler } from "hono";

/**
 * Custom 404 not found handler
 * Returns JSON response with error message and requested path
 */
const notFoundHandler: NotFoundHandler = (c: Context) => {
  return c.json({ error: "Not Found", path: c.req.path }, 404);
};

export { notFoundHandler };
