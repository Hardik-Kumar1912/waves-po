import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Supplier } from '@/lib/models/Supplier';

export async function GET() {
  await dbConnect();
  const suppliers = await Supplier.find().sort({ name: 1 }).lean();
  return NextResponse.json(suppliers);
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const supplier = await Supplier.create(body);
    return NextResponse.json(supplier, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
