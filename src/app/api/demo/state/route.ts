import { NextResponse } from "next/server";
import { getStore, getT3nRuntimeStatus } from "@/lib/store";

export async function GET() {
  const store = getStore();
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
