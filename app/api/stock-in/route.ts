import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { StockIn } from '@/lib/models/StockIn';
import { Item } from '@/lib/models/Item';

export async function GET() {
  await dbConnect();
  const records = await StockIn.find()
    .populate('itemId', 'name unit')
    .populate('supplierId', 'name')
    .sort({ date: -1 })
    .lean();
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { itemId, cartons, unitsPerCarton, supplierId, referenceNo, notes } = body;

    if (!itemId || !cartons || !unitsPerCarton) {
      return NextResponse.json({ error: 'itemId, cartons, and unitsPerCarton are required' }, { status: 400 });
    }

    const totalUnits = Number(cartons) * Number(unitsPerCarton);

    // Sequential awaited writes (safe for standalone + replica set MongoDB)
    const record = await StockIn.create({
      date: new Date(),
      itemId,
      cartons: Number(cartons),
      unitsPerCarton: Number(unitsPerCarton),
      totalUnits,
      supplierId: supplierId || undefined,
      referenceNo: referenceNo?.trim() || undefined,
      notes: notes?.trim() || undefined,
    });

    await Item.findByIdAndUpdate(itemId, { $inc: { currentStock: totalUnits } });

    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
