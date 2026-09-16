import mongoose, { Schema, Model } from 'mongoose';

export interface ISupplier {
  _id: mongoose.Types.ObjectId;
  name: string;
  address: string;
  gstn?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    gstn: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Supplier: Model<ISupplier> =
  (mongoose.models.Supplier as Model<ISupplier>) ??
  mongoose.model<ISupplier>('Supplier', SupplierSchema);
