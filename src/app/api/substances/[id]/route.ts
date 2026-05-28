import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const substance = await db.substance.findUnique({ where: { id } });
    if (!substance) {
      return NextResponse.json({ error: 'Substance not found' }, { status: 404 });
    }
    return NextResponse.json(substance);
  } catch (error) {
    console.error('Failed to fetch substance:', error);
    return NextResponse.json({ error: 'Failed to fetch substance' }, { status: 500 });
  }
}
