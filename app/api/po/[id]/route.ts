import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { PurchaseOrder } from '@/lib/models/PurchaseOrder';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const po = await PurchaseOrder.findById(id)
    .populate('supplierId')
    .lean();

  if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(po);
}
