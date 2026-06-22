import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/lab-saves — list all saved lab states
export async function GET() {
  try {
    const saves = await db.labState.findMany({
      orderBy: { updatedAt: "desc" },
      include: { containers: true },
    });
    return NextResponse.json(
      saves.map((s) => ({
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        containerCount: s.containers.length,
        totalContents: s.containers.reduce(
          (sum, c) => sum + JSON.parse(c.contents).length,
          0
        ),
      }))
    );
  } catch (error) {
    console.error("Failed to list lab saves:", error);
    return NextResponse.json({ error: "Failed to list saves" }, { status: 500 });
  }
}

// POST /api/lab-saves — save current lab state under a name
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, containers } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!Array.isArray(containers)) {
      return NextResponse.json({ error: "Containers array required" }, { status: 400 });
    }

    // Check if a save with this name already exists; if so, update it
    const existing = await db.labState.findFirst({ where: { name } });

    let labState;
    if (existing) {
      // Replace containers
      await db.labContainerState.deleteMany({ where: { labStateId: existing.id } });
      for (const c of containers) {
        await db.labContainerState.create({
          data: {
            labStateId: existing.id,
            containerId: c.id,
            type: c.type || "beaker",
            positionX: c.position?.[0] || 0,
            positionY: c.position?.[1] || 0,
            positionZ: c.position?.[2] || 0,
            rotationX: c.rotation?.[0] || 0,
            rotationY: c.rotation?.[1] || 0,
            rotationZ: c.rotation?.[2] || 0,
            capacity: c.capacity || 250,
            contents: JSON.stringify(c.contents || []),
            temperature: c.temperature ?? 25,
            pressure: c.pressure ?? 101.325,
            isHeating: c.isHeating ?? false,
            isBroken: c.isBroken ?? false,
          },
        });
      }
      labState = await db.labState.update({
        where: { id: existing.id },
        data: { updatedAt: new Date() },
        include: { containers: true },
      });
    } else {
      labState = await db.labState.create({
        data: {
          name,
          isActive: false,
          containers: {
            create: containers.map((c: any) => ({
              containerId: c.id,
              type: c.type || "beaker",
              positionX: c.position?.[0] || 0,
              positionY: c.position?.[1] || 0,
              positionZ: c.position?.[2] || 0,
              rotationX: c.rotation?.[0] || 0,
              rotationY: c.rotation?.[1] || 0,
              rotationZ: c.rotation?.[2] || 0,
              capacity: c.capacity || 250,
              contents: JSON.stringify(c.contents || []),
              temperature: c.temperature ?? 25,
              pressure: c.pressure ?? 101.325,
              isHeating: c.isHeating ?? false,
              isBroken: c.isBroken ?? false,
            })),
          },
        },
        include: { containers: true },
      });
    }

    return NextResponse.json({
      id: labState.id,
      name: labState.name,
      containerCount: labState.containers.length,
      savedAt: labState.updatedAt,
    });
  } catch (error) {
    console.error("Failed to save lab state:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
