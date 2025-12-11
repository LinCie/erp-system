import type {
  GenerateTokenOptions,
  IAuthSecurity,
  VerifyTokenOptions,
} from "../application/auth-security.interface.ts";
import { IAuthRepository } from "../application/auth-repository.interface.ts";

import bcrypt from "bcryptjs";
import { sign, verify } from "hono/jwt";
import { encodeHex } from "@std/encoding/hex";

const REFRESH_TOKEN_EXPIRES_IN = "7d";
const ACCESS_TOKEN_EXPIRES_IN = "15m";

/**
 * Implementation of authentication security operations including password hashing,
 * token generation, and token verification.
 */
class AuthSecurity implements IAuthSecurity {
  constructor(private readonly authRepository: IAuthRepository) {}

  /**
   * Verifies a password against a bcrypt hash.
   * Handles conversion from $2y$ (PHP) to $2b$ (Node.js) hash format.
   * @param password - Plain text password to verify
   * @param hash - Bcrypt hash to compare against
   * @returns Promise resolving to true if password matches, false otherwise
   */
  verifyPassword(password: string, hash: string) {
    const parsedHash = hash.replace(/^\$2y/, "$2b");
    return bcrypt.compare(password, parsedHash);
  }

  /**
   * Verifies a JWT token (access or refresh).
   * @param options - Token verification options including token string and type
   * @returns Promise resolving to the decoded JWT payload
   * @throws Error if JWT_SECRET is not defined in environment
   * @throws Error if token is invalid
   */
  async verifyToken(options: VerifyTokenOptions) {
    const jwtSecret = Deno.env.get("JWT_SECRET");
    if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

    switch (options.type) {
      case "access":
        return this.verifyAccessToken(options.token, jwtSecret);

      case "refresh":
        return await this.verifyRefreshToken(options.token, jwtSecret);
    }
  }

  /**
   * Verifies an access token.
   * @param token - JWT access token to verify
   * @param secret - Secret key for JWT verification
   * @returns Decoded JWT payload
   * @throws Error with message "ACCESS_TOKEN_INVALID" if verification fails
   */
  async verifyAccessToken(token: string, secret: string) {
    try {
      const payload = await verify(token, secret);
      return payload;
    } catch {
      throw new Error("ACCESS_TOKEN_INVALID");
    }
  }

  /**
   * Verifies a refresh token by checking JWT signature and validating against stored hash.
   * @param token - JWT refresh token to verify
   * @param secret - Secret key for JWT verification
   * @returns Promise resolving to decoded JWT payload
   * @throws Error with message "REFRESH_TOKEN_INVALID" if verification fails
   */
  async verifyRefreshToken(token: string, secret: string) {
    try {
      const payload = await verify(token, secret);
      const identifier = this.authRepository.generateKey(payload);

      const storedHash = await this.authRepository.getRefreshToken(identifier);
      if (!storedHash) throw new Error();

      const tokenHash = await this.generateTokenHash(token);
      if (tokenHash !== storedHash) throw new Error();

      return payload;
    } catch {
      throw new Error("REFRESH_TOKEN_INVALID");
    }
  }

  /**
   * Generates a JWT token (access or refresh).
   * @param options - Token generation options including userId, type, and optional session
   * @returns Signed JWT token string
   * @throws Error if JWT_SECRET is not defined in environment
   */
  async generateToken(options: GenerateTokenOptions) {
    const session = options.session ?? this.generateSession();
    const jwtSecret = Deno.env.get("JWT_SECRET");
    if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

    const expiresIn = options.type === "access"
      ? ACCESS_TOKEN_EXPIRES_IN
      : REFRESH_TOKEN_EXPIRES_IN;

    // Convert expiration string to seconds
    const expirationSeconds = this.parseExpirationTime(expiresIn);
    const exp = Math.floor(Date.now() / 1000) + expirationSeconds;

    const payload = {
      sub: options.userId.toString(),
      jti: session,
      exp,
    };

    const token = await sign(payload, jwtSecret);
    return token;
  }

  /**
   * Parses expiration time string (e.g., "15m", "7d") to seconds.
   * @param expiresIn - Expiration time string
   * @returns Number of seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error("Invalid expiration format");

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * multipliers[unit];
  }

  /**
   * Generates a unique session identifier using UUID v4.
   * @returns UUID string for session identification
   */
  generateSession() {
    return crypto.randomUUID();
  }

  /**
   * Generates a bcrypt hash for a password.
   * Converts hash format from $2a$/$2b$ (Node.js) to $2y$ (PHP compatible).
   * @param password - Plain text password to hash
   * @returns Promise resolving to bcrypt hash string in PHP-compatible format
   */
  async generatePasswordHash(password: string) {
    const hash = await bcrypt.hash(password, 12);
    return hash.replace(/^\$2[ab]\$/, "$2y$");
  }

  /**
   * Hashes a token using SHA-256 for secure storage.
   * Uses Deno standard library for crypto operations.
   * @param token - Token string to hash
   * @returns SHA-256 hash string in hexadecimal format
   */
  async generateTokenHash(token: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return encodeHex(hashBuffer);
  }
}

export { AuthSecurity };
