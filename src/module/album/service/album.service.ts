import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { AlbumRepository } from '../interface/album.repository';
import { Album } from '../schema/album.schema';
import { CreateAlbumRequestDto } from '../dto/request/create-album.request.dto';
import { UserDto } from '../../auth/dto/user.dto';

@Injectable()
export class AlbumService {
  private readonly logger = new Logger(AlbumService.name);
  constructor(
    @Inject('ALBUM_REPOSITORY')
    private readonly albumRepository: AlbumRepository,
  ) {}

  async findAll(_id: string): Promise<Album[]> {
    try {
      const albums = await this.albumRepository.findAll(_id);
      return albums;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async insert(
    user: UserDto,
    _id: string,
    body: CreateAlbumRequestDto,
  ): Promise<Album> {
    try {
      return this.albumRepository.insert(user, _id, body);
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async delete(_id: string): Promise<Album> {
    try {
      return this.albumRepository.delete(_id);
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }
}
