import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Supplier } from '@/lib/models/Supplier';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const supplier = await Supplier.findByIdAndUpdate(id, body, { new: true });
  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  await Supplier.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
