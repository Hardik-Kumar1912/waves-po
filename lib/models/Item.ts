import mongoose, { Schema, Model } from 'mongoose';

export interface IItem {
  _id: mongoose.Types.ObjectId;
  name: string;
  unitRate: number;
  mrp?: number;
  taxRate: number;
  // Inventory fields
  unit: string;
  unitsPerCarton: number;
  currentStock: number;
  lowStockThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true },
    unitRate: { type: Number, required: true },
    mrp: { type: Number },
    taxRate: { type: Number, default: 18 },
    // Inventory fields — currentStock is managed by StockIn/Dispatch operations only
    unit: { type: String, default: 'pcs', trim: true },
    unitsPerCarton: { type: Number, default: 1 },
    currentStock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number },
  },
  { timestamps: true }
);

export const Item: Model<IItem> =
  (mongoose.models.Item as Model<IItem>) ??
  mongoose.model<IItem>('Item', ItemSchema);
