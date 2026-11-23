import { randomUUID } from 'crypto';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../../../../config/environment';
import { ITokenService, TokenPair } from '../../application/services/ITokenService';

export class JWTService implements ITokenService {
  generateTokens(payload: JwtPayload): TokenPair {
    // jwt.sign é determinístico (HS256) para o mesmo payload+secret+iat —
    // dois logins/refreshes do mesmo usuário no mesmo segundo geram o
    // MESMO refresh token, o que colide com a unique constraint em
    // refresh_tokens.token. jti garante um token distinto por chamada.
    const accessOptions: SignOptions = { expiresIn: env.jwtExpiresIn };
    const refreshOptions: SignOptions = { expiresIn: env.refreshExpiresIn };

    const accessToken = jwt.sign(
      { ...payload, jti: randomUUID() },
      env.jwtSecret as jwt.Secret,
      accessOptions,
    );

    const refreshToken = jwt.sign(
      { ...payload, jti: randomUUID() },
      env.refreshSecret as jwt.Secret,
      refreshOptions,
    );

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.refreshSecret as jwt.Secret, { algorithms: ['HS256'] }) as JwtPayload;
  }
}

