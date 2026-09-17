import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Dispatch } from '@/lib/models/Dispatch';
import { Item } from '@/lib/models/Item';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const record = await Dispatch.findById(id);
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Reverse all stock decrements before deleting
  for (const line of record.lineItems) {
    await Item.findByIdAndUpdate(line.itemId, { $inc: { currentStock: line.qty } });
  }
  await Dispatch.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
