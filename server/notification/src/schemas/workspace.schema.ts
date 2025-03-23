import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Workspace extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
