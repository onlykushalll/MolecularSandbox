import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const hazards = await db.ghsHazard.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json(hazards);
  } catch (error) {
    console.error('Failed to fetch GHS hazards:', error);
    return NextResponse.json({ error: 'Failed to fetch GHS hazards' }, { status: 500 });
  }
}
