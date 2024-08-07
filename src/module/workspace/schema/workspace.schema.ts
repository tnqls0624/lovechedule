import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Expose, Transform, Type } from 'class-transformer';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';

export type WorkspaceDocument = Workspace & Document<Types.ObjectId>;

export enum WorkspaceStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE'
}

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
  @Prop({ type: String, required: true })
  title: string;

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

  @Expose()
  @Type(() => Tag)
  @Prop({
    type: [
      {
        _id: { type: Types.ObjectId, default: () => new Types.ObjectId() },
        color: { type: String, required: true },
        name: { type: String, required: true }
      }
    ],
    default: []
  })
  tags: Tag[];

  @Expose()
  @Prop({
    type: String,
    enum: WorkspaceStatus,
    default: WorkspaceStatus.PENDING
  })
  status: WorkspaceStatus;

  @Expose()
  @Prop({ type: String, required: true, index: true })
  invite_code: string;

  @Expose()
  @Prop({ type: String, required: true })
  love_day: string;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
WorkspaceSchema.virtual('workspace', {
  ref: 'Schedule',
  localField: '_id',
  foreignField: 'workspace'
});
WorkspaceSchema.set('toObject', { virtuals: true });
WorkspaceSchema.set('toJSON', { virtuals: true });
