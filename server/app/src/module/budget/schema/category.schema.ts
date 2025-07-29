import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions, Types } from 'mongoose';

const options: SchemaOptions = {
  id: false,
  collection: 'categories',
  timestamps: true
};

@Schema(options)
export class Category extends Document {
  @Prop({
    required: true,
    ref: 'Workspace'
  })
  workspaceId: Types.ObjectId;

  @Prop({
    required: true
  })
  name: string;

  @Prop({
    required: true,
    enum: ['income', 'expense']
  })
  type: 'income' | 'expense';

  @Prop({
    required: false
  })
  icon?: string;

  @Prop({
    required: false
  })
  color?: string;

  @Prop({
    default: false
  })
  isDefault: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
