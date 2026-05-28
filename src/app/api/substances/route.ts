import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const state = searchParams.get('state') || '';
    const limit = parseInt(searchParams.get('limit') || '0');

    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { iupacName: { contains: search } },
        { formula: { contains: search } },
        { id: { contains: search } },
        { casNumber: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (state) where.stateAt25C = state;

    const substances = await db.substance.findMany({
      where,
      take: limit || undefined,
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(substances);
  } catch (error) {
    console.error('Failed to fetch substances:', error);
    return NextResponse.json({ error: 'Failed to fetch substances' }, { status: 500 });
  }
}
