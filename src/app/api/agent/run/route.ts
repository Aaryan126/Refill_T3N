import { NextResponse } from "next/server";
import { runAgentScenario } from "@/lib/runner";
import type { DemoScenario } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mandateId?: string;
    scenario?: DemoScenario;
  };

  try {
    const result = await runAgentScenario({
      mandateId: body.mandateId,
      scenario: body.scenario ?? "success"
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent run failed" },
      { status: 400 }
    );
  }
}
