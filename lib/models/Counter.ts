import mongoose, { Schema, Model } from 'mongoose';

export interface ICounter {
  _id: mongoose.Types.ObjectId;
  name: string; // e.g. "po-2026"
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export const Counter: Model<ICounter> =
  (mongoose.models.Counter as Model<ICounter>) ??
  mongoose.model<ICounter>('Counter', CounterSchema);
