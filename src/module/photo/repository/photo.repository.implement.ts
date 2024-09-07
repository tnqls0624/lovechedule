import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PhotoRepository } from '../interface/photo.repository';
import { Photo } from '../schema/photo.schema';

@Injectable()
export class PhotoRepositoryImplement implements PhotoRepository {
  constructor(
    @InjectModel(Photo.name, 'lovechedule')
    private schedule_model: Model<Photo>
    // @InjectModel(Workspace.name, 'lovechedule')
    // private workspace_model: Model<Workspace>,
  ) {}
}
