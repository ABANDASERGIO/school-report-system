import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { TOKEN_TYPES } from '../config/constants';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: 'PROPRIETOR' | 'TEACHER';
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

export type AccessToken = string;
export type RefreshToken = string;

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): AccessToken {
  const options: SignOptions = {
    expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(
    { ...payload, type: TOKEN_TYPES.ACCESS },
    env.jwt.accessSecret,
    options
  );
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): RefreshToken {
  const options: SignOptions = {
    expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(
    { ...payload, type: TOKEN_TYPES.REFRESH },
    env.jwt.refreshSecret,
    options
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload & AccessTokenPayload;
  if (decoded.type !== TOKEN_TYPES.ACCESS) {
    throw new Error('Invalid token type');
  }
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    type: 'access',
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.jwt.refreshSecret) as JwtPayload & RefreshTokenPayload;
  if (decoded.type !== TOKEN_TYPES.REFRESH) {
    throw new Error('Invalid token type');
  }
  return {
    userId: decoded.userId,
    type: 'refresh',
  };
}
