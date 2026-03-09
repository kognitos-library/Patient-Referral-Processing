import { NextResponse } from "next/server";
import { fetchReferrals } from "@/lib/referrals";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchReferrals();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
