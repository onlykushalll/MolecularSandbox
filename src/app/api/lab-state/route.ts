import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let labState = await db.labState.findFirst({
      where: { isActive: true },
      include: { containers: true },
    });
    if (!labState) {
      labState = await db.labState.create({
        data: { name: "default", isActive: true },
        include: { containers: true },
      });
    }
    return NextResponse.json(labState);
  } catch (error) {
    console.error("Failed to fetch lab state:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab state" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { containers } = body;

    let labState = await db.labState.findFirst({ where: { isActive: true } });
    if (!labState) {
      labState = await db.labState.create({
        data: { name: "default", isActive: true },
      });
    }

    await db.labContainerState.deleteMany({
      where: { labStateId: labState.id },
    });

    if (containers && containers.length > 0) {
      for (const c of containers) {
        await db.labContainerState.create({
          data: {
            labStateId: labState.id,
            containerId: c.id,
            type: c.type,
            positionX: c.position[0],
            positionY: c.position[1],
            positionZ: c.position[2],
            rotationX: c.rotation[0],
            rotationY: c.rotation[1],
            rotationZ: c.rotation[2],
            capacity: c.capacity,
            contents: JSON.stringify(c.contents),
            temperature: c.temperature,
            pressure: c.pressure,
            isHeating: c.isHeating,
            isBroken: c.isBroken,
          },
        });
      }
    }

    const result = await db.labState.findUnique({
      where: { id: labState.id },
      include: { containers: true },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to save lab state:", error);
    return NextResponse.json(
      { error: "Failed to save lab state" },
      { status: 500 }
    );
  }
}
