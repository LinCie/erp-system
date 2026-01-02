import { z } from "@hono/zod-openapi";

/**
 * Schema for validation issue details
 */
const validationIssueSchema = z.object({
  code: z.string().openapi({ example: "invalid_type" }),
  message: z.string().openapi({ example: "Expected number, received string" }),
  path: z.array(z.union([z.string(), z.number()])).openapi({
    example: ["details", 0, "quantity"],
  }),
});

/**
 * Schema for error responses
 * Used for validation errors (400), not found errors (404), and other error responses
 */
const errorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "VALIDATION_ERROR" }),
    message: z.string().openapi({ example: "Invalid request body" }),
    details: z.record(z.string(), z.array(z.string())).optional().openapi({
      example: {
        "handler_id": ["Required field is missing"],
        "details.0.quantity": ["Must be a valid decimal string"],
      },
    }),
  })
  .openapi("TradeErrorResponse");

/**
 * Schema for not found error responses
 */
const notFoundErrorSchema = z
  .object({
    error: z.string().openapi({ example: "TRADE_NOT_FOUND" }),
    message: z.string().openapi({ example: "Trade with ID 999 not found" }),
  })
  .openapi("TradeNotFoundError");

export { errorResponseSchema, notFoundErrorSchema, validationIssueSchema };
