import { NextResponse } from "next/server";
import { orchestrateAgentRequest } from "@/lib/llm-orchestrator";
import { runAgentScenario } from "@/lib/runner";
import { addAudit, getStore } from "@/lib/store";
import type { AgentTraceEntry } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
  };
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  try {
    const nonActionReply = getNonActionReply(message);
    if (nonActionReply) {
      return NextResponse.json({
        type: "message",
        userMessage: message,
        assistantMessage: nonActionReply
      });
    }

    const store = getStore();
    const orchestration = await orchestrateAgentRequest({
      userMessage: message,
      mandates: store.mandates,
      inventory: store.inventory,
      products: store.products
    });

    addAudit({
      actorType: "system",
      actorId: "openai_orchestrator",
      eventType: "llm_orchestrated",
      title: "LLM selected agent action",
      details: {
        model: orchestration.model,
        scenario: orchestration.scenario,
        confidence: orchestration.confidence,
        rationale: orchestration.rationale
      }
    });

    const result = await runAgentScenario({
      scenario: orchestration.scenario
    });
    const routeTrace: AgentTraceEntry = {
      id: `trace_llm_${Date.now()}`,
      at: new Date().toISOString(),
      actor: "llm",
      status: "ok",
      command: "llm.route_request",
      detail: `Mapped request to ${orchestration.scenario} with ${Math.round(orchestration.confidence * 100)}% confidence.`,
      metadata: {
        model: orchestration.model,
        confidence: Math.round(orchestration.confidence * 100)
      }
    };

    return NextResponse.json({
      ...result,
      userMessage: message,
      orchestration,
      trace: [routeTrace, ...result.trace]
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "LLM orchestration failed" },
      { status: 400 }
    );
  }
}

function getNonActionReply(message: string) {
  const normalized = message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();

  if (/^(hi|hello|hey|yo|sup|thanks|thank you|ok|okay)$/.test(normalized)) {
    return "Hi. Tell me what you want refilled or checked, and I will only take action when your request maps to a refill task.";
  }

  const actionTerms = [
    "refill",
    "buy",
    "purchase",
    "order",
    "checkout",
    "stock",
    "low",
    "lens",
    "solution",
    "pet",
    "food",
    "allergy",
    "medicine",
    "merchant",
    "budget",
    "quantity",
    "bottle",
    "tablets"
  ];

  if (!actionTerms.some((term) => normalized.includes(term))) {
    return "I can help with refill checks and delegated purchases. Ask me to check stock, refill an approved item, or test a blocked scenario.";
  }

  return null;
}
