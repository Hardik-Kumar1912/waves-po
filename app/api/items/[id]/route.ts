import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Item } from '@/lib/models/Item';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const item = await Item.findByIdAndUpdate(id, body, { new: true });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  await Item.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
