import { NextResponse } from "next/server";
import { addAudit, getStore } from "@/lib/store";
import type { RefillMandate } from "@/lib/types";

export async function GET() {
  const store = getStore();
  return NextResponse.json(store.mandates);
}

export async function POST(request: Request) {
  const store = getStore();
  const body = (await request.json()) as Partial<RefillMandate>;
  const now = new Date().toISOString();
  const mandate: RefillMandate = {
    id: `mandate_${Date.now()}`,
    userId: store.user.id,
    agentId: store.agent.id,
    status: "active",
    category: body.category ?? "contact_lens_solution",
    approvedSkus: body.approvedSkus ?? [],
    approvedMerchants: body.approvedMerchants ?? [],
    maxPriceSgd: body.maxPriceSgd ?? 18,
    maxQuantity: body.maxQuantity ?? 1,
    trigger: body.trigger ?? { type: "stock_percentage", thresholdPercent: 20 },
    delivery: body.delivery ?? { maxDays: 3 },
    requiresUserConfirmation: body.requiresUserConfirmation ?? false,
    sensitiveFieldRefs: store.user.sealedRefs,
    createdAt: now,
    updatedAt: now
  };

  store.mandates.push(mandate);
  addAudit({
    actorType: "user",
    actorId: store.user.id,
    eventType: "mandate_created",
    title: "Mandate created",
    details: { mandateId: mandate.id, category: mandate.category }
  });

  return NextResponse.json(mandate, { status: 201 });
}
