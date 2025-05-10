import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Expose, Transform } from "class-transformer";
import { Document, Types } from "mongoose";

export type UserDocument = User & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: "users",
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

  @Expose()
  @Prop({
    type: String,
  })
  login_type: string;

  @Expose()
  @Prop({
    type: String,
  })
  gender: string;

  @Expose()
  @Prop({
    type: String,
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

// 알림 관련 복합 인덱스 추가
UserSchema.index({ push_enabled: 1, schedule_alarm: 1, fcm_token: 1 });
UserSchema.index({ push_enabled: 1, anniversary_alarm: 1, fcm_token: 1 });

// 인덱스가 확실히 생성되도록 ensureIndexes 호출
UserSchema.set("autoIndex", true);

UserSchema.virtual("workspaces", {
  ref: "Workspace",
  localField: "_id",
  foreignField: "users",
});
UserSchema.set("toObject", { virtuals: true });
UserSchema.set("toJSON", { virtuals: true });
