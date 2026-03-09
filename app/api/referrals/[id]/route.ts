import { NextResponse } from "next/server";
import { fetchReferralDetail } from "@/lib/referrals";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const detail = await fetchReferralDetail(id);
    return NextResponse.json(detail);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
