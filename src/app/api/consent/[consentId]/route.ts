import { NextResponse } from "next/server";
import { approvePendingConsent, rejectPendingConsent } from "@/lib/runner";

export async function POST(request: Request, { params }: { params: Promise<{ consentId: string }> }) {
  const { consentId } = await params;
  const body = (await request.json().catch(() => ({}))) as { decision?: "approve" | "reject" };

  try {
    if (body.decision === "reject") {
      return NextResponse.json({
        type: "rejected",
        pendingConsent: rejectPendingConsent(consentId)
      });
    }

    return NextResponse.json(await approvePendingConsent(consentId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Consent update failed" },
      { status: 400 }
    );
  }
}
