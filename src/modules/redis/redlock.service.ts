import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedlockService implements OnModuleDestroy {
  private readonly redlock: Redlock;
  private readonly logger = new Logger(RedlockService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {
    this.redlock = new Redlock([this.redisClient], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200, // time in ms
      retryJitter: 50, // time in ms
      automaticExtensionThreshold: 500, // time in ms
    });

    this.redlock.on('error', (error) => {
      this.logger.error('A redis error has occurred:', error);
    });
  }

  async acquireLock(resource: string, ttlMs: number = 5000): Promise<Lock> {
    this.logger.debug(`Acquiring lock for ${resource}`);
    return await this.redlock.acquire([resource], ttlMs);
  }

  async releaseLock(lock: Lock): Promise<void> {
    try {
      if (lock) {
        await lock.release();
        this.logger.debug(`Released lock`);
      }
    } catch (e) {
      this.logger.warn(`Failed to release lock, might have already expired: ${e.message}`);
    }
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }
}
