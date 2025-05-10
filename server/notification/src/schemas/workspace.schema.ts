import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Expose, Transform, Type } from "class-transformer";
import { Document, Types } from "mongoose";
import { User } from "./user.schema";
export type WorkspaceDocument = Workspace & Document<Types.ObjectId>;
@Schema({
  timestamps: true,
  collection: "workspaces",
})
export class Workspace {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  @Type(() => User)
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  master: Types.ObjectId;

  @Expose()
  @Type(() => User)
  @Prop({
    type: [{ type: Types.ObjectId, ref: "User", required: true }],
    default: [],
  })
  users: Types.ObjectId[] | User[];

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
    type: String,
  })
  thumbnail_image: string;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

// users 필드에 대한 인덱스 추가
WorkspaceSchema.index({ users: 1 });

// 인덱스가 확실히 생성되도록 ensureIndexes 호출
WorkspaceSchema.set("autoIndex", true);
