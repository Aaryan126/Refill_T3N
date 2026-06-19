import { NextResponse } from "next/server";
import { addAudit, getStore } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await context.params;
  const body = (await request.json()) as {
    currentPercent?: number;
    currentUnits?: number;
    estimatedDaysRemaining?: number;
  };
  const store = getStore();
  const item = store.inventory.find((inventoryItem) => inventoryItem.id === itemId);

  if (!item) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }

  if (body.currentPercent !== undefined) item.currentPercent = body.currentPercent;
  if (body.currentUnits !== undefined) item.currentUnits = body.currentUnits;
  if (body.estimatedDaysRemaining !== undefined) item.estimatedDaysRemaining = body.estimatedDaysRemaining;
  item.lastUpdatedAt = new Date().toISOString();

  addAudit({
    actorType: "user",
    actorId: store.user.id,
    eventType: "stock_updated",
    title: "Stock updated",
    details: { itemId: item.id, currentPercent: item.currentPercent, currentUnits: item.currentUnits }
  });

  return NextResponse.json(item);
}
