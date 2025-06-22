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
  email: string;

  @Expose()
  @Prop({ required: true, type: String })
  name: string;

  // 비밀번호 - EMAIL 로그인 타입에서만 사용
  @Prop({ type: String, required: false })
  password: string;

  @Expose()
  @Prop({
    type: String,
    enum: LoginType,
    default: LoginType.BASIC
  })
  login_type: string;

  @Expose()
  @Prop({
    type: String
  })
  gender: string;

  @Expose()
  @Prop({
    type: String
  })
  birthday: string;

  @Expose()
  @Prop({ type: String, required: true, index: true })
  invite_code: string;

  @Expose()
  @Prop({ type: String, required: false, index: true })
  fcm_token: string;

  @Expose()
  @Prop({ type: Boolean, default: true })
  push_enabled: boolean;

  @Expose()
  @Prop({ type: Boolean, default: true })
  schedule_alarm: boolean;

  @Expose()
  @Prop({ type: Boolean, default: true })
  anniversary_alarm: boolean;

  // @Expose()
  // @Prop({ type: Boolean, default: true })
  // message_alarm: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('workspaces', {
  ref: 'Workspace',
  localField: '_id',
  foreignField: 'users'
});
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });
