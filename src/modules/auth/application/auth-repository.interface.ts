import { UserEntity as User } from "../domain/user.entity.ts";

interface GetUserByEmailData {
  email: string;
}

interface IAuthRepository {
  storeRefreshToken: (session: string, value: string) => Promise<void>;
  getRefreshToken: (key: string) => Promise<string | undefined>;
  deleteRefreshToken: (key: string) => Promise<void>;
  getUserByEmail: (data: GetUserByEmailData) => Promise<User | undefined>;
  getUserById: (id: number) => Promise<User | undefined>;
  createUser: (user: Omit<User, "id">) => Promise<User | undefined>;
  generateKey: (payload: object) => string;
}

export type { GetUserByEmailData, IAuthRepository };
