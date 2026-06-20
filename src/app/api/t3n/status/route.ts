import { NextResponse } from "next/server";
import { getT3nRuntimeStatus } from "@/lib/store";

export async function GET() {
  return NextResponse.json(getT3nRuntimeStatus());
}
