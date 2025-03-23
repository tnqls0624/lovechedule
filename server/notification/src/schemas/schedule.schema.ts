import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema()
export class Schedule extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: Types.ObjectId, ref: "Workspace" })
  workspaceId: Types.ObjectId;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
