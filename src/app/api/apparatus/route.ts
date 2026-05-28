import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const apparatus = await db.apparatus.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json(apparatus);
  } catch (error) {
    console.error('Failed to fetch apparatus:', error);
    return NextResponse.json({ error: 'Failed to fetch apparatus' }, { status: 500 });
  }
}
