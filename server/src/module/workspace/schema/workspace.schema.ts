import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Expose, Transform, Type } from 'class-transformer';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';

export type WorkspaceDocument = Workspace & Document<Types.ObjectId>;

export class Tag {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  @Prop({ required: true, type: String })
  color: string;

  @Expose()
  @Prop({ required: true, type: String })
  name: string;
}

@Schema({
  timestamps: true,
  collection: 'workspaces'
})
export class Workspace {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  @Type(() => User)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  master: Types.ObjectId;

  @Expose()
  @Type(() => User)
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User', required: true }],
    default: []
  })
  users: string[];

  // @Expose()
  // @Type(() => Tag)
  // @Prop({
  //   type: [
  //     {
  //       color: { type: String, required: true },
  //       name: { type: String, required: true }
  //     }
  //   ],
  //   default: []
  // })
  // tags: Tag[];

  // @Expose()
  // @Prop({
  //   type: String,
  //   enum: WorkspaceStatus,
  //   default: WorkspaceStatus.PENDING
  // })
  // status: WorkspaceStatus;

  @Expose()
  @Prop({ type: String, required: true })
  love_day: string;

  @Expose()
  @Prop({
    type: Object,
    default: {
      anniversary: '🎉',
      together: '👩‍❤️‍👨'
    }
  })
  emoji: any

  @Expose()
  @Prop({
    type: String,
  })
  thumbnail_image: string
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);