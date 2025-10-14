import { RateLimiterMemory } from 'rate-limiter-flexible';

const limiter = new RateLimiterMemory({ points: 100, duration: 60 });

export function rateLimiter(req, res, next) {
  limiter.consume(req.ip).then(() => next()).catch(() => {
    res.set('Retry-After', '60');
    res.status(429).json({ error: 'Too Many Requests' });
  });
}
