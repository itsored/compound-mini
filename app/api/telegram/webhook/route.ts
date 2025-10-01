import { NextRequest, NextResponse } from "next/server"

// Minimal Telegram webhook handler with a shared secret check.
// Expects Telegram to POST updates to:
//   /api/telegram/webhook?secret=TELEGRAM_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json({ ok: false, error: "Webhook secret not configured" }, { status: 500 })
    }

    const url = new URL(request.url)
    const providedSecret = url.searchParams.get("secret")
    if (!providedSecret || providedSecret !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    // Parse Telegram update payload
    const update = await request.json().catch(() => null)
    if (!update) {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
    }

    // Basic health/echo handling: reply immediately so Telegram doesn't retry
    // You can extend this to process messages, commands, etc.
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

