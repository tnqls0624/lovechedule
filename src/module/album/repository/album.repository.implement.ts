import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlbumRepository } from '../interface/album.repository';
import { Album } from '../schema/album.schema';
import { CreateAlbumRequestDto } from '../dto/request/create-album.request.dto';
import { UserDto } from '../../auth/dto/user.dto';

@Injectable()
export class AlbumRepositoryImplement implements AlbumRepository {
  constructor(
    @InjectModel(Album.name, 'lovechedule')
    private album_model: Model<Album>,
  ) {}

  insert(
    user: UserDto,
    _id: string,
    body: CreateAlbumRequestDto,
  ): Promise<Album> {
    const album_model = new this.album_model({
      workspace: new Types.ObjectId(_id),
      writer: new Types.ObjectId(user._id),
      ...body,
    });
    return album_model.save();
  }

  findAll(_id: string): Promise<Album[]> {
    return this.album_model
      .find({
        workspace: new Types.ObjectId(_id),
      })
      .populate('photos')
      .exec();
  }

  delete(_id: string): Promise<Album> {
    return this.album_model
      .findOneAndDelete({
        _id: new Types.ObjectId(_id),
      })
      .exec();
  }
}
