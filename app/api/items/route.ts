import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Item } from '@/lib/models/Item';

export async function GET() {
  await dbConnect();
  const items = await Item.find().sort({ name: 1 }).lean();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const item = await Item.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
