import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Dispatch } from '@/lib/models/Dispatch';
import { Item } from '@/lib/models/Item';

export async function GET() {
  await dbConnect();
  const records = await Dispatch.find()
    .populate('lineItems.itemId', 'name unit')
    .sort({ date: -1 })
    .lean();
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { recipient, referenceNo, lineItems, notes } = body;

    if (!recipient?.trim()) {
      return NextResponse.json({ error: 'recipient is required' }, { status: 400 });
    }
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'at least one line item is required' }, { status: 400 });
    }

    // Create dispatch record first
    const record = await Dispatch.create({
      date: new Date(),
      recipient: recipient.trim(),
      referenceNo: referenceNo?.trim() || undefined,
      lineItems,
      notes: notes?.trim() || undefined,
    });

    // Decrement stock for each line item (sequential awaited updates)
    for (const line of lineItems) {
      await Item.findByIdAndUpdate(line.itemId, { $inc: { currentStock: -line.qty } });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
