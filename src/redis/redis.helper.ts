import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Injectable()
export class RedisHelper {
  private redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: any, ttlSeconds?: number) {
    const data = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds) {
      return this.redis.set(key, data, 'EX', ttlSeconds);
    }

    return this.redis.set(key, data);
  }

  async del(key: string) {
    return this.redis.del(key);
  }

  async incr(key: string) {
    return this.redis.incr(key);
  }

  async decr(key: string) {
    return this.redis.decr(key);
  }

  async lpush(key: string, value: any) {
    return this.redis.lpush(key, JSON.stringify(value));
  }

  async lrange(key: string, start = 0, stop = 19) {
    return this.redis.lrange(key, start, stop);
  }

  async ltrim(key: string, start = 0, stop = 19) {
    return this.redis.ltrim(key, start, stop);
  }

  async lrem(key: string, value: any) {
    return this.redis.lrem(key, 0, JSON.stringify(value));
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
}
