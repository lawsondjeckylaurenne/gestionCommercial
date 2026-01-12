import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
console.log(`Initializing Redis Client with URL: ${REDIS_URL}`);

// Create Redis Client
const redisClient = createClient({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 50) { // Increased retries
                console.error('Redis: Max reconnection attempts reached');
                return new Error('Redis connection failed');
            }
            // Exponential backoff with jitter
            const delay = Math.min(retries * 500, 3000);
            return delay;
        },
        connectTimeout: 10000,
    }
});

redisClient.on('error', (err) => {
    // Only log, don't crash
    console.warn('Redis Client Error (RateLimiter):', err.message);
});

redisClient.on('connect', () => {
    console.log('Redis connected successfully');
});

// Initialize function to be called from index.ts
export const initRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Redis initial connection failed, rate limiting will be disabled:', err);
    }
};

// Rate Limiters
// We use a "Fail Open" strategy: if Redis is down, we fallback to memory or allow requests.
// RateLimiterRedis throws an error if Redis is down/disconnected.

const generalLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware_general',
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
    insuranceLimiter: new RateLimiterMemory({ // Fallback to memory if Redis is down
        points: 100,
        duration: 60,
    }),
});

const authLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware_auth',
    points: 5,
    duration: 5 * 60,
    insuranceLimiter: new RateLimiterMemory({
        points: 5,
        duration: 5 * 60,
    }),
});

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    generalLimiter.consume(req.ip || 'unknown')
        .then(() => {
            next();
        })
        .catch((rejRes) => {
            if (rejRes instanceof Error) {
                // System error (e.g. Redis down and no insurance), allow traffic
                console.warn('RateLimiter error (General), allowing traffic:', rejRes.message);
                next();
            } else {
                // Rate limited
                res.status(429).json({ message: 'Too Many Requests' });
            }
        });
};

export const authRateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    authLimiter.consume(req.ip || 'unknown')
        .then(() => {
            next();
        })
        .catch((rejRes) => {
             if (rejRes instanceof Error) {
                // System error, allow traffic
                console.warn('RateLimiter error (Auth), allowing traffic:', rejRes.message);
                next();
            } else {
                // Rate limited
                res.status(429).json({ message: 'Too many login attempts, please try again later.' });
            }
        });
};
