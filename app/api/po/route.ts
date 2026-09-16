import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { PurchaseOrder } from '@/lib/models/PurchaseOrder';
import { Counter } from '@/lib/models/Counter';

export async function GET() {
  await dbConnect();
  const pos = await PurchaseOrder.find()
    .populate('supplierId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(pos);
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();

    // Generate order number: YYYYNNNN (atomic increment per year)
    const year = new Date().getFullYear();
    const counterKey = `po-${year}`;

    const counter = await Counter.findOneAndUpdate(
      { name: counterKey },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );

    const orderNumber = `${year}${String(counter.seq).padStart(4, '0')}`;

    const po = await PurchaseOrder.create({
      ...body,
      orderNumber,
      orderDate: new Date(),
    });

    return NextResponse.json(po, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
