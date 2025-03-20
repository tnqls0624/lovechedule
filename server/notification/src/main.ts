import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3100);
  console.log('Notification server is running on port 3100');
}
bootstrap(); 