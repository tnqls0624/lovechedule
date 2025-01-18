import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger } from '@nestjs/common';
import { RedisIoAdapter } from './adapter/redis.adapter';
import { SuccessInterceptor } from './interceptor/success.interceptor';
import * as process from 'node:process';

declare const module: any;

async function bootstrap() {
  console.log(`redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
  const app = await NestFactory.create(AppModule);

  const redis_io_adapter = await connectRedis(app);
  const logger = new Logger(bootstrap.name);
  setupSwagger(app);
  const api_prefix = '/v1/app';
  app.setGlobalPrefix(api_prefix);
  app.useWebSocketAdapter(redis_io_adapter);
  app.useGlobalInterceptors(new SuccessInterceptor());
  app.enableCors({
    origin: true,
    credentials: true
  });

  await app.listen(3000);
  logger.log(`Lovechedule Server is Running On: ${await app.getUrl()}`);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

function setupSwagger(app: INestApplication): void {
  const documentBuilder = new DocumentBuilder()
    .setTitle('API 문서')
    .setDescription(
      process.env.MODE === 'dev' || process.env.MODE === 'local'
        ? '개발용 API 문서입니다'
        : '운영용 API 문서입니다'
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'authorization',
      description: 'Enter JWT token',
      in: 'header'
    })
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilder);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });
}

async function connectRedis(app: INestApplication): Promise<RedisIoAdapter> {
  const redis_io_adapter = new RedisIoAdapter(app);
  await redis_io_adapter.connectToRedis();
  return redis_io_adapter;
}
bootstrap();
