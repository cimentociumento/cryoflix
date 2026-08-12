import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../../../../config/environment';
import { ITokenService, TokenPair } from '../../application/services/ITokenService';

export class JWTService implements ITokenService {
  generateTokens(payload: JwtPayload): TokenPair {
    const accessOptions: SignOptions = { expiresIn: env.jwtExpiresIn };
    const refreshOptions: SignOptions = { expiresIn: env.refreshExpiresIn };

    const accessToken = jwt.sign(payload, env.jwtSecret as jwt.Secret, accessOptions);

    const refreshToken = jwt.sign(payload, env.refreshSecret as jwt.Secret, refreshOptions);

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.refreshSecret as jwt.Secret) as JwtPayload;
  }
}

