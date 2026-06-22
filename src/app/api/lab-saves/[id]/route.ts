import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/lab-saves/[id] — load a specific saved lab state
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const labState = await db.labState.findUnique({
      where: { id },
      include: { containers: true },
    });
    if (!labState) {
      return NextResponse.json({ error: "Save not found" }, { status: 404 });
    }
    // Parse container contents back into arrays
    const containers = labState.containers.map((c) => ({
      id: c.containerId,
      type: c.type,
      position: [c.positionX, c.positionY, c.positionZ] as [number, number, number],
      rotation: [c.rotationX, c.rotationY, c.rotationZ] as [number, number, number],
      capacity: c.capacity,
      contents: JSON.parse(c.contents),
      temperature: c.temperature,
      pressure: c.pressure,
      isHeating: c.isHeating,
      isBroken: c.isBroken,
    }));
    return NextResponse.json({
      id: labState.id,
      name: labState.name,
      containers,
      savedAt: labState.updatedAt,
    });
  } catch (error) {
    console.error("Failed to load lab save:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// DELETE /api/lab-saves/[id] — delete a saved lab state
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.labState.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lab save:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
