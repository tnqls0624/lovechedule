import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Expose, Transform, Type } from 'class-transformer';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';
import { Photo } from '../../photo/schema/photo.schema';
import { Workspace } from '../../workspace/schema/workspace.schema';

export type AlbumDocument = Album & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'albums'
})
export class Album {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  @Prop({ type: String, required: true })
  title: string;

  @Expose()
  @Type(() => User)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  writer: Types.ObjectId;

  @Expose()
  @Type(() => Workspace)
  @Prop({ type: Types.ObjectId, ref: 'Workspace' })
  workspace: Types.ObjectId;

  @Expose()
  @Type(() => Photo)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Photo' }] })
  photos: Types.ObjectId[];
}

export const AlbumSchema = SchemaFactory.createForClass(Album);
