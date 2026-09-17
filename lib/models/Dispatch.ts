import mongoose, { Schema, Model } from 'mongoose';
import './Item';

export interface IDispatchLine {
  itemId: mongoose.Types.ObjectId;
  qty: number;
}

export interface IDispatch {
  _id: mongoose.Types.ObjectId;
  date: Date;
  recipient: string;
  referenceNo?: string;
  lineItems: IDispatchLine[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DispatchLineSchema = new Schema<IDispatchLine>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    qty: { type: Number, required: true },
  },
  { _id: false }
);

const DispatchSchema = new Schema<IDispatch>(
  {
    date: { type: Date, required: true, default: Date.now },
    recipient: { type: String, required: true, trim: true },
    referenceNo: { type: String, trim: true },
    lineItems: { type: [DispatchLineSchema], required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Dispatch: Model<IDispatch> =
  (mongoose.models.Dispatch as Model<IDispatch>) ??
  mongoose.model<IDispatch>('Dispatch', DispatchSchema);
