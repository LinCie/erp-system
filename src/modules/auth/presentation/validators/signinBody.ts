import { z } from "zod";

const signinBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export { signinBodySchema };
