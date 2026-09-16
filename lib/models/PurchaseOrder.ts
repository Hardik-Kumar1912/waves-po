import mongoose, { Schema, Model } from 'mongoose';
import './Supplier';
import './Item';

export interface ILineItem {
  itemId: mongoose.Types.ObjectId;
  description: string;
  qty: number;
  mrp?: number;
  unitRate: number;
  amount: number;
}

export interface IPurchaseOrder {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  orderDate: Date;
  supplierId: mongoose.Types.ObjectId;
  lineItems: ILineItem[];
  basicAmount: number;
  taxRate: number;
  gstAmount: number;
  grandTotal: number;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    description: { type: String, required: true },
    qty: { type: Number, required: true },
    mrp: { type: Number },
    unitRate: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    orderDate: { type: Date, required: true, default: Date.now },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    lineItems: { type: [LineItemSchema], required: true },
    basicAmount: { type: Number, required: true },
    taxRate: { type: Number, required: true, default: 18 },
    gstAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    terms: { type: String },
  },
  { timestamps: true }
);

export const PurchaseOrder: Model<IPurchaseOrder> =
  (mongoose.models.PurchaseOrder as Model<IPurchaseOrder>) ??
  mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
