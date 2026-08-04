import type { NextFunction, Request, Response } from "express";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60 * 60 * 1000;
const MAX_BY_ACTOR = 10;
const MAX_BY_IP = 20;
const actorBuckets = new Map<string, RateLimitBucket>();
const ipBuckets = new Map<string, RateLimitBucket>();

function getBucket(
  buckets: Map<string, RateLimitBucket>,
  key: string,
  now: number,
): RateLimitBucket {
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const nextBucket = {
      count: 0,
      resetAt: now + WINDOW_MS,
    };
    buckets.set(key, nextBucket);
    return nextBucket;
  }

  return current;
}

function incrementBucket(bucket: RateLimitBucket): void {
  bucket.count += 1;
}

export function resetBusinessUserPasswordRateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const now = Date.now();
  const actorKey = `actor:${req.auth?.idUser ?? "anonymous"}`;
  const ipKey = `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
  const actorBucket = getBucket(actorBuckets, actorKey, now);
  const ipBucket = getBucket(ipBuckets, ipKey, now);

  if (actorBucket.count >= MAX_BY_ACTOR || ipBucket.count >= MAX_BY_IP) {
    res.status(429).json({
      success: false,
      message:
        "Demasiados restablecimientos de contrasena. Intente nuevamente mas tarde.",
      data: null,
    });
    return;
  }

  incrementBucket(actorBucket);
  incrementBucket(ipBucket);
  next();
}
