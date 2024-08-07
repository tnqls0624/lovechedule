import { Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Photo, PhotoSchema } from './schema/photo.schema';
import { PhotoService } from './service/photo.service';
import { PhotoController } from './controller/photo.controller';
import { PhotoRepositoryImplement } from './repository/photo.repository.implement';

const infrastructure: Provider[] = [
  {
    provide: 'PHOTO_REPOSITORY',
    useClass: PhotoRepositoryImplement,
  },
];

const services = [PhotoService];

const controller = [PhotoController];

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Photo.name, schema: PhotoSchema }],
      'lovechedule',
    ),
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
})
export class PhotoModule {}
