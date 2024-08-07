import { Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';
import { Photo } from '../../photo/schema/photo.schema';
import { Workspace } from '../../workspace/schema/workspace.schema';

export class AlbumDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  title: string;

  @Expose()
  @Type(() => User)
  writer: Types.ObjectId;

  @Expose()
  @Type(() => Workspace)
  workspace: Types.ObjectId;

  @Expose()
  @Type(() => Photo)
  photos: Types.ObjectId[];
}
