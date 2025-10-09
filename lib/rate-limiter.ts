import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  statusCode?: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Simple in-memory store (for production, use Redis or similar)
const store: RateLimitStore = {};

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100, // 100 requests default
      message: 'Too many requests, please try again later.',
      statusCode: 429,
      ...config
    };
  }

  async check(request: NextRequest): Promise<{ allowed: boolean; response?: NextResponse }> {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const key = `${ip}:${request.url}`;

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up expired entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return { allowed: true };
    }

    if (store[key].count >= this.config.maxRequests) {
      const response = NextResponse.json(
        { error: this.config.message },
        { status: this.config.statusCode }
      );
      response.headers.set('Retry-After', Math.ceil((store[key].resetTime - now) / 1000).toString());
      return { allowed: false, response };
    }

    store[key].count++;
    return { allowed: true };
  }
}

// Default rate limiter
export const defaultRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per 15 minutes
});
