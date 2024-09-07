import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { createClient } from 'redis';

// 이벤트 리스너의 최대 수를 100으로 증가시킴
EventEmitter.defaultMaxListeners = 100;

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
      url: this.REDIS_HOST
    });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  /**
   * create socket.io server using redis adapter
   * @param {number} port port of server
   * @param {ServerOptions} options options of socket.io server
   * @returns {Promise<Server>}
   */
  createIOServer(port: number, options?: ServerOptions): unknown {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    this.logger.log(`Create SocketIO Server using redis adapter`);
    return server;
  }
}
