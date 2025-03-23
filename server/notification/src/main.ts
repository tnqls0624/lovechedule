import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { INestApplication } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

declare const module: any;

async function bootstrap() {
  // 하이브리드 어플리케이션 생성 (HTTP + gRPC)
  const notification = await NestFactory.create(AppModule);

  // gRPC 마이크로서비스 설정
  notification.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "notification",
      protoPath: join(__dirname, "proto/notification.proto"),
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
      url: process.env.NOTIFICATION_GRPC_URL, // gRPC 서버 포트 (모든 인터페이스에서 수신)
    },
  });

  // HTTP REST API 설정
  const notification_prefix = "/notification";
  notification.setGlobalPrefix(notification_prefix);

  setupSwagger(notification);
  notification.enableCors({
    origin: true,
    credentials: true,
  });

  // 마이크로서비스 시작
  await notification.startAllMicroservices();

  // HTTP 서버 시작
  await notification.listen(3100);

  console.log("Notification server is running on port 3100");
  console.log("gRPC server is running on port 9000");

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => notification.close());
  }
}

function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Notification API")
    .setDescription("The notification API description")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);
}

bootstrap();
