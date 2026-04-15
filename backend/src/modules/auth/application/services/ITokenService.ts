import { JwtPayload } from 'jsonwebtoken';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export interface ITokenService {
  generateTokens(payload: JwtPayload): TokenPair;
  verifyRefreshToken(token: string): JwtPayload;
}

