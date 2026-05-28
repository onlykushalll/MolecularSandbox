import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { solveReaction } from '@/lib/chemistry/stoichiometry';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contents, volumeML, temperatureK, hasCatalyst, containerClosed, ppe } = body;

    if (!contents || typeof contents !== 'object') {
      return NextResponse.json({ error: 'contents must be an object mapping substance IDs to mass in grams' }, { status: 400 });
    }

    const result = await solveReaction({
      contents,
      volumeML: volumeML || 100,
      temperatureK: temperatureK || 298.15,
      hasCatalyst: hasCatalyst || false,
      containerClosed: containerClosed || false,
      ppe: ppe || { gloves: false, goggles: false, labCoat: false, fumeHood: false },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Reaction solver error:', error);
    return NextResponse.json({ error: 'Reaction solver failed', details: String(error) }, { status: 500 });
  }
}
