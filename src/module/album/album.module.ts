import { Module, Provider } from '@nestjs/common';
import { AlbumController } from './controller/album.controller';
import { AlbumService } from './service/album.service';
import { AlbumRepositoryImplement } from './repository/album.repository.implement';
import { MongooseModule } from '@nestjs/mongoose';
import { Album, AlbumSchema } from './schema/album.schema';

const infrastructure: Provider[] = [
  {
    provide: 'ALBUM_REPOSITORY',
    useClass: AlbumRepositoryImplement,
  },
];

const services = [AlbumService];

const controller = [AlbumController];

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Album.name, schema: AlbumSchema }],
      'lovechedule',
    ),
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
  exports: [...services, ...infrastructure],
})
export class AlbumModule {}
