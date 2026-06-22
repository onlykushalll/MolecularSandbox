import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { ReactionData } from "@/lib/chemistry/types";

export async function GET() {
  try {
    const reactions = await db.reaction.findMany({
      include: {
        reactants: { include: { chemical: true } },
        products: { include: { chemical: true } },
      },
      orderBy: { name: "asc" },
    });
    const transformed: ReactionData[] = reactions.map((r) => ({
      id: r.id,
      name: r.name,
      equation: r.equation,
      deltaH: r.deltaH,
      reactionType: r.reactionType as ReactionData["reactionType"],
      isReversible: r.isReversible,
      conditions: JSON.parse(r.conditions),
      description: r.description,
      reactants: r.reactants.map((rr) => ({
        chemicalId: rr.chemicalId,
        coefficient: rr.coefficient,
        isLimiting: rr.isLimiting,
      })),
      products: r.products.map((p) => ({
        chemicalId: p.chemicalId,
        coefficient: p.coefficient,
      })),
    }));
    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Failed to fetch reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}
