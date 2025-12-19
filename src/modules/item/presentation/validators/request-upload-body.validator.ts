import { z } from "@hono/zod-openapi";

const requestUploadBodySchema = z.object({
  contentType: z.string().openapi({
    description: "Content-Type of the file",
    example: "image/png",
  }),
  size: z.number().openapi({
    description: "Size of the file in bytes",
    example: 1000000,
  }),
}).openapi("requestUploadBodySchema");

type RequestUploadBody = z.infer<typeof requestUploadBodySchema>;

export type { RequestUploadBody };
export { requestUploadBodySchema };
