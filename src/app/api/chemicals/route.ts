import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { ChemicalData, GHSHazard } from "@/lib/chemistry/types";

export async function GET() {
  try {
    const chemicals = await db.chemical.findMany({
      orderBy: { category: "asc" },
    });
    const transformed: ChemicalData[] = chemicals.map((c) => ({
      id: c.id,
      name: c.name,
      formula: c.formula,
      molarMass: c.molarMass,
      density: c.density,
      specificHeatCapacity: c.specificHeatCapacity,
      surfaceTension: c.surfaceTension,
      vaporPressure: c.vaporPressure,
      boilingPoint: c.boilingPoint,
      meltingPoint: c.meltingPoint,
      hexColor: c.hexColor,
      stateAtSTP: c.stateAtSTP as "solid" | "liquid" | "gas",
      hazards: JSON.parse(c.hazards) as GHSHazard[],
      solubility: JSON.parse(c.solubility) as Record<string, number>,
      refractiveIndex: c.refractiveIndex,
      viscosity: c.viscosity,
      category: c.category as ChemicalData["category"],
      description: c.description,
    }));
    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Failed to fetch chemicals:", error);
    return NextResponse.json(
      { error: "Failed to fetch chemicals" },
      { status: 500 }
    );
  }
}
