import { Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Photo, PhotoSchema } from './schema/photo.schema';
import { PhotoService } from './service/photo.service';
import { PhotoController } from './controller/photo.controller';
import { PhotoRepositoryImplement } from './repository/photo.repository.implement';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';

const infrastructure: Provider[] = [
  {
    provide: 'PHOTO_REPOSITORY',
    useClass: PhotoRepositoryImplement
  }
];

const services = [PhotoService];

const controller = [PhotoController];

// ✅ Multer 설정: 업로드된 파일을 메모리에 저장하도록 설정
const multerConfig = {
  storage: multer.memoryStorage(), // ✅ 메모리 저장 (S3 업로드 전 버퍼로 저장)
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한 (필요하면 조정 가능)
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error('❌ 지원하지 않는 파일 형식입니다.'), false);
    }
    callback(null, true);
  },
};

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Photo.name, schema: PhotoSchema }],
      'lovechedule'
    ),
    MulterModule.register(multerConfig)
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure]
})
export class PhotoModule {}
