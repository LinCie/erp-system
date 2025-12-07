import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { getRedis } from "@/shared/infrastructure/caching/index.ts";
import { AuthRepository } from "../infrastructure/auth.repository.ts";
import { AuthSecurity } from "../infrastructure/auth.security.ts";
import { AuthService } from "../application/auth.service.ts";
import { defineAuthController } from "./auth.controller.ts";

async function createAuthModule() {
  const db = getDatabase();
  const redis = await getRedis();

  const authRepo = new AuthRepository(db, redis);
  const authSecurity = new AuthSecurity(authRepo);
  const authService = new AuthService(authRepo, authSecurity);
  const authController = defineAuthController(authService);

  return { authController };
}

export { createAuthModule };
