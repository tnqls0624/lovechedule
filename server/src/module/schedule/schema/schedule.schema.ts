import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Expose, Transform, Type } from 'class-transformer';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';
import { Workspace } from '../../workspace/schema/workspace.schema';

export type ScheduleDocument = Schedule & Document<Types.ObjectId>;

@Schema({
  timestamps: true,
  collection: 'schedules'
})
export class Schedule {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  _id: Types.ObjectId;

  @Expose()
  @Prop({ required: true, type: String })
  title: string;

  @Expose()
  @Prop({ type: String })
  memo: string;

  @Expose()
  @Prop({ required: true, type: Boolean, default: false })
  is_anniversary: boolean;

  @Expose()
  @Prop({ required: true, type: String })
  start_date: string;

  @Expose()
  @Prop({ required: true, type: String })
  end_date: string;

  @Expose()
  @Prop({ type: String, enum: ['none', 'monthly', 'yearly'], default: 'none' })
  repeat_type: 'none' | 'monthly' | 'yearly';


  // @Expose()
  // @Prop({ required: true, type: String })
  // alram_date: string;

  @Expose()
  @Type(() => User)
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: []
  })
  participants: string[];

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

  @Expose()
  @Type(() => Workspace)
  @Prop({ type: Types.ObjectId, ref: 'Workspace' })
  workspace: Types.ObjectId;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
