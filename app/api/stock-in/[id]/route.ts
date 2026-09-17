import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { StockIn } from '@/lib/models/StockIn';
import { Item } from '@/lib/models/Item';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const record = await StockIn.findById(id);
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Reverse the stock increment before deleting
  await Item.findByIdAndUpdate(record.itemId, { $inc: { currentStock: -record.totalUnits } });
  await StockIn.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
