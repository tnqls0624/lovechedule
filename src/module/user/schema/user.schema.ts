import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Expose, Transform } from 'class-transformer';
import { Document, Types } from 'mongoose';
import { LoginType } from '../../../common/type/user';

export type UserDocument = User & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'users'
})
export class User {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  @Prop({ required: true, type: String, unique: true })
  user_id: string;

  @Prop({ required: true, type: String })
  password: string;

  @Expose()
  @Prop({ required: true, type: String })
  name: string;

  @Expose()
  @Prop({
    type: String,
    enum: LoginType,
    default: LoginType.BASIC
  })
  login_type: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('workspaces', {
  ref: 'Workspace',
  localField: '_id',
  foreignField: 'users'
});
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });
