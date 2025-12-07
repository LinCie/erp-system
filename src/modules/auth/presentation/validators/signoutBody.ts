import { z } from "zod";

const signoutBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export { signoutBodySchema };
