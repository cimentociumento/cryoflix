import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../../../../config/environment';
import { ITokenService, TokenPair } from '../../application/services/ITokenService';

export class JWTService implements ITokenService {
  generateTokens(payload: JwtPayload): TokenPair {
    const accessOptions: SignOptions = { expiresIn: env.jwtExpiresIn };
    const refreshOptions: SignOptions = { expiresIn: env.refreshExpiresIn };

    const accessPayload = { ...payload, jti: randomUUID() };
    const refreshPayload = { ...payload, jti: randomUUID() };

    const accessToken = jwt.sign(accessPayload, env.jwtSecret as jwt.Secret, accessOptions);

    const refreshToken = jwt.sign(refreshPayload, env.refreshSecret as jwt.Secret, refreshOptions);

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.refreshSecret as jwt.Secret) as JwtPayload;
  }
}

