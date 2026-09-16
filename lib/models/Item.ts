import mongoose, { Schema, Model } from 'mongoose';

export interface IItem {
  _id: mongoose.Types.ObjectId;
  name: string;
  unitRate: number;
  mrp?: number;
  taxRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true },
    unitRate: { type: Number, required: true },
    mrp: { type: Number },
    taxRate: { type: Number, default: 18 },
  },
  { timestamps: true }
);

export const Item: Model<IItem> =
  (mongoose.models.Item as Model<IItem>) ??
  mongoose.model<IItem>('Item', ItemSchema);
