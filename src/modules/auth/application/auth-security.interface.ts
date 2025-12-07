type TokenType = "access" | "refresh";

interface GenerateTokenOptions {
  userId: number;
  type: TokenType;
  session?: string;
}

interface VerifyTokenOptions {
  token: string;
  type: TokenType;
}

interface IAuthSecurity {
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  verifyToken: (options: VerifyTokenOptions) => Promise<unknown>;
  generateToken: (options: GenerateTokenOptions) => Promise<string>;
  generateSession: () => string;
  generatePasswordHash: (password: string) => Promise<string>;
  generateTokenHash: (token: string) => Promise<string>;
}

export type { GenerateTokenOptions, IAuthSecurity, VerifyTokenOptions };
