import { z } from "zod";

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export { refreshBodySchema };
