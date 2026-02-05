import type { Context, ErrorHandler } from "hono";
import * as Sentry from "@sentry/node";
import { HTTPException } from "hono/http-exception";
import { MapperError } from "../../domain/errors/mapper.error.ts";
import {
  InvalidError,
  NotFoundError,
} from "../../domain/errors/common.error.ts";

/**
 * Known application error codes mapped to HTTP status codes
 */
const KNOWN_ERRORS: Record<string, 400 | 401 | 403 | 404 | 500> = {
  USER_NOT_FOUND: 404,
  PASSWORD_INCORRECT: 401,
  ITEM_NOT_FOUND: 404,
  SPACE_NOT_FOUND: 404,
  ACCESS_TOKEN_INVALID: 401,
  REFRESH_TOKEN_INVALID: 401,
};

/**
 * Global error handler middleware
 * Handles HTTPException and known application errors
 */
const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  const env = Deno.env.get("NODE_ENV");

  if (env === "production") {
    Sentry.captureException(err);
  } else {
    console.error(err);
  }

  if (err instanceof MapperError) {
    return c.json({
      error: err.message,
      code: err.code,
      field: err.field,
      details: err.details,
    }, 400);
  }

  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message, status: err.status },
      err.status,
    );
  }

  if (err instanceof InvalidError) {
    return c.json(
      { error: err.message, status: 400 },
      400,
    );
  }

  if (err instanceof NotFoundError) {
    return c.json(
      { error: err.message, status: 404 },
      404,
    );
  }

  const statusCode = KNOWN_ERRORS[err.message] ?? 500;
  const message = statusCode === 500 ? "Internal Server Error" : err.message;

  return c.json({ error: message, status: statusCode }, statusCode);
};

export { errorHandler, KNOWN_ERRORS };
