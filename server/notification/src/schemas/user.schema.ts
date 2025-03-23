import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  email: string;

  @Prop()
  fcm_token: string;

  @Prop({ default: true })
  push_enabled: boolean;

  @Prop({ default: true })
  schedule_alarm: boolean;

  @Prop({ default: true })
  anniversary_alarm: boolean;

  @Prop({ type: Types.ObjectId, ref: "Workspace" })
  workspaceId: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
