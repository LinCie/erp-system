import type {
  GetUserByEmailData,
  IAuthRepository,
} from "../application/auth-repository.interface.ts";
import type { UserEntity } from "../domain/user.entity.ts";
import type { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import type { RedisClientType } from "redis";

const REDIS_REFRESH_TOKEN_PREFIX = "refresh_token";
const REFRESH_TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Implementation of authentication repository handling user data and refresh tokens.
 * Uses MySQL for user data and Redis for refresh token storage.
 */
class AuthRepository implements IAuthRepository {
  /**
   * Creates an instance of AuthRepository.
   * @param db - Database instance for user data operations
   * @param redis - Redis client instance for refresh token storage
   */
  constructor(
    private readonly db: PersistenceType,
    private readonly redis: RedisClientType,
  ) {}

  /**
   * Stores a refresh token in Redis with expiration.
   * @param key - Redis key identifier (should include prefix, userId, and session)
   * @param value - Hashed refresh token value
   * @returns Promise that resolves when token is stored
   */
  async storeRefreshToken(key: string, value: string): Promise<void> {
    await this.redis.set(key, value, {
      EX: REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    });
  }

  /**
   * Retrieves a refresh token from Redis.
   * @param key - Redis key identifier
   * @returns Promise resolving to the token value or undefined if not found
   */
  async getRefreshToken(key: string): Promise<string | undefined> {
    const value = await this.redis.get(key);
    return value ?? undefined;
  }

  /**
   * Deletes a refresh token from Redis.
   * @param key - Redis key identifier
   * @returns Promise that resolves when token is deleted
   */
  async deleteRefreshToken(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Generates a Redis key for refresh token storage.
   * @param payload - Object containing sub (userId) and jti (session) properties
   * @returns Formatted Redis key string
   */
  generateKey(payload: object): string {
    const { sub, jti } = payload as { sub: string; jti: string };
    return `${REDIS_REFRESH_TOKEN_PREFIX}:${sub}:${jti}`;
  }

  /**
   * Retrieves a user by email address.
   * @param data - Object containing email to search for
   * @returns Promise resolving to UserEntity or undefined if not found
   */
  async getUserByEmail(
    data: GetUserByEmailData,
  ): Promise<UserEntity | undefined> {
    const user = await this.db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", data.email)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    if (!user) return undefined;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      status: user.status,
      created_at: user.created_at ?? undefined,
      updated_at: user.updated_at ?? undefined,
      deleted_at: user.deleted_at ?? undefined,
    };
  }

  /**
   * Retrieves a user by ID.
   * @param id - User ID to search for
   * @returns Promise resolving to UserEntity or undefined if not found
   */
  async getUserById(id: number): Promise<UserEntity | undefined> {
    const user = await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    if (!user) return undefined;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      status: user.status,
      created_at: user.created_at ?? undefined,
      updated_at: user.updated_at ?? undefined,
      deleted_at: user.deleted_at ?? undefined,
    };
  }

  /**
   * Creates a new user in the database.
   * @param user - User data without id
   * @returns Promise resolving to created UserEntity or undefined if creation fails
   */
  async createUser(
    user: Omit<UserEntity, "id">,
  ): Promise<UserEntity | undefined> {
    const result = await this.db
      .insertInto("users")
      .values({
        name: user.name,
        email: user.email,
        password: user.password,
        status: user.status,
      })
      .executeTakeFirst();

    if (!result.insertId) return undefined;

    return {
      id: Number(result.insertId),
      ...user,
    };
  }
}

export { AuthRepository };
