import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Expose, Transform, Type } from 'class-transformer';
import { Document, Types } from 'mongoose';

export type PhotoDocument = Photo & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'photos'
})
export class Photo {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  @Prop({ type: String, required: true })
  url: string;

  @Expose()
  @Prop({ type: String })
  description: string;
}

export const PhotoSchema = SchemaFactory.createForClass(Photo);
