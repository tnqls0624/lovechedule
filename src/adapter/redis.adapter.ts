import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext, Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  constructor(appOrHttpServer: INestApplicationContext) {
    super(appOrHttpServer);
  }
  private logger = new Logger(RedisIoAdapter.name);
  private REDIS_HOST = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    this.logger.debug(`Connect to Redis : ${this.REDIS_HOST}`);

    const pubClient = createClient({
      url: this.REDIS_HOST,
    });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    this.logger.log(`Create SocketIO Server using redis adapter`);
    return server;
  }
}
