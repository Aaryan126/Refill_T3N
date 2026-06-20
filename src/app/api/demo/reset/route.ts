import { NextResponse } from "next/server";
import { getT3nRuntimeStatus, resetStore } from "@/lib/store";

export async function POST() {
  const store = resetStore();
  return NextResponse.json({
    user: store.user,
    agent: store.agent,
    mandates: store.mandates,
    inventory: store.inventory,
    products: store.products,
    audit: store.audit,
    pendingConsents: store.pendingConsents,
    trustStatus: getT3nRuntimeStatus()
  });
}
