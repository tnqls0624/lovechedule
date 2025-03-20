import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PhotoRepository } from '../interface/photo.repository';
import { Photo } from '../schema/photo.schema';

@Injectable()
export class PhotoRepositoryImplement implements PhotoRepository {
  constructor(
    @InjectModel(Photo.name, 'lovechedule')
    private photoModel: Model<Photo>
  ) {}

  async insert({ url, hash }): Promise<Photo> {
    return await new this.photoModel({ url, hash }).save();
  }

  async findHash(hash: string): Promise<Photo> {
    return await this.photoModel.findOne({ hash }).exec();
  }
}
