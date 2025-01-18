import { Expose, Transform, Type } from 'class-transformer';
import { Workspace } from '../../workspace/schema/workspace.schema';
import { Types } from 'mongoose';
import { Prop } from '@nestjs/mongoose';
import { User } from '../../user/schema/user.schema';

export class ScheduleDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  @Prop({ required: true, type: Date })
  date: Date;

  @Expose()
  @Type(() => User)
  participants: Types.ObjectId[];

  @Expose()
  @Type(() => Workspace)
  workspace: Types.ObjectId;
}
