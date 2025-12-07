import type { IAuthRepository } from "./auth-repository.interface.ts";
import type { IAuthSecurity } from "./auth-security.interface.ts";
import type { UserEntity as User } from "../domain/user.entity.ts";

interface SigninData {
  email: string;
  password: string;
}

interface SignupData extends SigninData {
  name: string;
}

class AuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly authSecurity: IAuthSecurity,
  ) {}

  async generateTokens(user: User, session: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.authSecurity.generateToken({
        userId: user.id,
        type: "access",
        session,
      }),
      this.authSecurity.generateToken({
        userId: user.id,
        type: "refresh",
        session,
      }),
    ]);

    const tokens = {
      access: accessToken,
      refresh: refreshToken,
    };

    const hashedRefreshToken = await this.authSecurity.generateTokenHash(
      tokens.refresh,
    );
    const key = this.authRepository.generateKey({
      sub: user.id.toString(),
      jti: session,
    });
    await this.authRepository.storeRefreshToken(key, hashedRefreshToken);

    return tokens;
  }

  async signIn(data: SigninData) {
    const user = await this.authRepository.getUserByEmail({
      email: data.email,
    });

    if (!user) throw new Error("USER_NOT_FOUND");

    const isPasswordCorrect = await this.authSecurity.verifyPassword(
      data.password,
      user.password,
    );

    if (!isPasswordCorrect) throw new Error("PASSWORD_INCORRECT");

    const session = this.authSecurity.generateSession();

    return this.generateTokens(user, session);
  }

  async signUp(data: SignupData) {
    const hash = await this.authSecurity.generatePasswordHash(data.password);
    const user = await this.authRepository.createUser({
      ...data,
      password: hash,
      status: "active",
    });

    if (!user) throw new Error("USER_NOT_CREATED");

    const session = this.authSecurity.generateSession();

    return this.generateTokens(user, session);
  }

  async signOut(token: string) {
    const payload = await this.authSecurity.verifyToken({
      token,
      type: "refresh",
    }) as object;
    const key = this.authRepository.generateKey(payload);
    await this.authRepository.deleteRefreshToken(key);
  }

  async refresh(token: string) {
    // verifyToken already checks the hashed token in Redis
    const payload = await this.authSecurity.verifyToken({
      token,
      type: "refresh",
    }) as { sub: string; jti: string };

    const userId = parseInt(payload.sub);
    const user = await this.authRepository.getUserById(userId);

    if (!user) throw new Error("USER_NOT_FOUND");

    return this.generateTokens(user, payload.jti);
  }
}

export { AuthService };
