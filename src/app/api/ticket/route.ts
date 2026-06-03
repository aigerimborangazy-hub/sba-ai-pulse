// ============================================================
// SBA AI Pulse — POST /api/ticket
//
// Stub endpoint for the training-funnel mechanic.
// Accepts {itemId, recommendation}, appends to /data/tickets.json.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const TICKETS_FILE = path.join(process.cwd(), "data", "tickets.json");

function ensureTicketsFile(): void {
  const dir = path.dirname(TICKETS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(TICKETS_FILE)) {
    fs.writeFileSync(TICKETS_FILE, "[]", "utf-8");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, recommendation } = body as {
      itemId?: string;
      recommendation?: string;
    };

    if (!itemId || !recommendation) {
      return NextResponse.json(
        { error: "Missing required fields: itemId, recommendation" },
        { status: 400 }
      );
    }

    ensureTicketsFile();

    // Read existing tickets
    let tickets: Array<Record<string, unknown>> = [];
    try {
      const raw = fs.readFileSync(TICKETS_FILE, "utf-8");
      tickets = JSON.parse(raw);
    } catch {
      tickets = [];
    }

    // Append new ticket
    tickets.push({
      id: crypto.randomBytes(6).toString("hex"),
      itemId,
      recommendation,
      createdAt: new Date().toISOString(),
      status: "pending",
    });

    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf-8");

    console.log(`[ticket] New ticket created for item ${itemId}`);

    return NextResponse.json({
      success: true,
      message: "Ticket created successfully",
    });
  } catch (error) {
    console.error("[ticket] Failed to create ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
