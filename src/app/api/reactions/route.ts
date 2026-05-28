import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';

    const where: Record<string, unknown> = {};
    if (type) where.reactionType = { contains: type };

    const reactions = await db.reaction.findMany({
      where,
      include: {
        reactantA: true,
        reactantB: true,
        catalyst: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(reactions);
  } catch (error) {
    console.error('Failed to fetch reactions:', error);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}
