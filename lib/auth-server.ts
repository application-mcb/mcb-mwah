import { auth as adminAuth } from './firebase-admin';
import { NextRequest } from 'next/server';
import { DecodedIdToken } from 'firebase-admin/auth';
import { logger } from './logger';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  role?: string;
}

export class AuthServer {
  /**
   * Verify Firebase ID token from request
   */
  static async verifyToken(request: NextRequest): Promise<AuthenticatedUser | null> {
    try {
      const authorization = request.headers.get('authorization');

      if (!authorization || !authorization.startsWith('Bearer ')) {
        logger.warn('No authorization header or invalid format');
        return null;
      }

      const token = authorization.split('Bearer ')[1];

      if (!token) {
        logger.warn('No token provided in authorization header');
        return null;
      }

      const decodedToken = await adminAuth.verifyIdToken(token);

      const user: AuthenticatedUser = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        emailVerified: decodedToken.email_verified || false,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        role: decodedToken.role || 'student', // Default role
      };

      logger.debug('Token verified successfully', { uid: user.uid });
      return user;
    } catch (error) {
      logger.error('Token verification failed', error);
      return null;
    }
  }

  /**
   * Get user from session cookie (alternative to token verification)
   */
  static async verifySession(request: NextRequest): Promise<AuthenticatedUser | null> {
    try {
      const sessionCookie = request.cookies.get('session')?.value;

      if (!sessionCookie) {
        logger.debug('No session cookie found');
        return null;
      }

      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

      const user: AuthenticatedUser = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        emailVerified: decodedToken.email_verified || false,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        role: decodedToken.role || 'student',
      };

      logger.debug('Session verified successfully', { uid: user.uid });
      return user;
    } catch (error) {
      logger.error('Session verification failed', error);
      return null;
    }
  }

  /**
   * Check if user has required role
   */
  static hasRole(user: AuthenticatedUser | null, requiredRole: string): boolean {
    if (!user) return false;

    const roleHierarchy = {
      'student': 1,
      'teacher': 2,
      'registrar': 3,
      'admin': 4
    };

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 999;

    return userRoleLevel >= requiredRoleLevel;
  }

  /**
   * Create session cookie
   */
  static async createSession(token: string): Promise<string> {
    try {
      // Session expires in 5 days
      const expiresIn = 60 * 60 * 24 * 5 * 1000;

      const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn });

      logger.debug('Session cookie created successfully');
      return sessionCookie;
    } catch (error) {
      logger.error('Failed to create session cookie', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Revoke all sessions for a user
   */
  static async revokeSessions(uid: string): Promise<void> {
    try {
      await adminAuth.revokeRefreshTokens(uid);
      logger.info('All sessions revoked for user', { uid });
    } catch (error) {
      logger.error('Failed to revoke sessions', error);
      throw new Error('Failed to revoke sessions');
    }
  }

  /**
   * Middleware helper to require authentication
   */
  static async requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
    const user = await this.verifyToken(request) || await this.verifySession(request);

    if (!user) {
      throw new Error('Authentication required');
    }

    return user;
  }

  /**
   * Middleware helper to require specific role
   */
  static async requireRole(request: NextRequest, role: string): Promise<AuthenticatedUser> {
    const user = await this.requireAuth(request);

    if (!this.hasRole(user, role)) {
      throw new Error(`Insufficient permissions. Required role: ${role}`);
    }

    return user;
  }
}