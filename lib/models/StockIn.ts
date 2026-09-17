import mongoose, { Schema, Model } from 'mongoose';
import './Item';
import './Supplier';

export interface IStockIn {
  _id: mongoose.Types.ObjectId;
  date: Date;
  itemId: mongoose.Types.ObjectId;
  cartons: number;
  unitsPerCarton: number;
  totalUnits: number;
  supplierId?: mongoose.Types.ObjectId;
  referenceNo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockInSchema = new Schema<IStockIn>(
  {
    date: { type: Date, required: true, default: Date.now },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    cartons: { type: Number, required: true },
    unitsPerCarton: { type: Number, required: true },
    totalUnits: { type: Number, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    referenceNo: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const StockIn: Model<IStockIn> =
  (mongoose.models.StockIn as Model<IStockIn>) ??
  mongoose.model<IStockIn>('StockIn', StockInSchema);
