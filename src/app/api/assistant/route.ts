import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are Dr. Beaker, the AI Lab Assistant for "The Molecular Sandbox" — a 3D chemistry simulator.

Your role:
- Help users understand chemistry concepts and reactions
- Explain what happens when chemicals mix (stoichiometry, thermodynamics, observations)
- Suggest experiments they can try
- Provide safety guidance for hazardous chemicals
- Explain why reactions are exothermic/endothermic using ΔH values
- Describe visual observations (color changes, precipitates, gas evolution, temperature changes)

Available chemicals in the lab: Water, Hydrochloric Acid, Sodium Hydroxide, Sodium Chloride, Copper Sulfate, Iron, Hydrogen Peroxide, Potassium Iodide, Lead Nitrate, Lead Iodide, Magnesium, Zinc, Sodium Bicarbonate, Calcium Carbonate, Sulfuric Acid, Nitric Acid, Ethanol, Acetic Acid, Ammonia, Sodium Carbonate, Copper, Silver Nitrate, Copper Nitrate, Silver, Copper Hydroxide, Sodium Sulfate, Potassium Nitrate, Magnesium Chloride, Zinc Chloride, Calcium Chloride, Carbon Dioxide, Oxygen, Hydrogen, Manganese Dioxide, Water (Liquid), Iron Sulfate, Barium Chloride, Barium Sulfate, Ammonium Chloride, Potassium Permanganate, Potassium Manganate, Cobalt Chloride.

Available reactions include: Neutralization (NaOH + HCl), Copper Sulfate Precipitation, H2O2 Decomposition (with MnO2 catalyst), Golden Rain (KI + Pb(NO3)2), Baking Soda + Acid, Mg/Zn + Acid, Limestone + Acid, Silver Tree (AgNO3 + Cu), Iron + CuSO4, Sulfate Test, Ammonia + HCl, Carbonate + Acid, KMnO4 Decomposition, Cobalt Hydration.

Keep responses concise (2-4 sentences) unless asked for detail. Use chemistry terminology appropriately. Include ΔH values when discussing thermodynamics. If asked about something unrelated to chemistry, gently redirect to the lab.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, labContext } = body as {
      messages: ChatMessage[];
      labContext?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Build the message array with system prompt + lab context
    const fullMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (labContext) {
      fullMessages.push({
        role: "system",
        content: `Current lab state: ${labContext}`,
      });
    }

    // Add conversation history (last 10 messages to keep context manageable)
    const recentMessages = messages.slice(-10);
    fullMessages.push(...recentMessages);

    const completion = await zai.chat.completions.create({
      messages: fullMessages,
      thinking: { type: "disabled" },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response,
      usage: completion.usage,
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "AI assistant unavailable",
      },
      { status: 500 }
    );
  }
}
