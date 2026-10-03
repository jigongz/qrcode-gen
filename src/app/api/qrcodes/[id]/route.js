import { NextResponse } from "next/server";
import { updateQRCode, deleteQRCode, getQRCodeById } from "@/lib/qr-service";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const qr = await getQRCodeById(id);
    if (!qr) {
      return NextResponse.json(
        { success: false, error: "QR code not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: qr });
  } catch (error) {
    console.error("GET /api/qrcodes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch QR code" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { destinationUrl, name } = body;

    const existing = await getQRCodeById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "QR Code not found" },
        { status: 404 }
      );
    }

    const updates = {};
    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }
    if (typeof destinationUrl === "string" && destinationUrl.trim()) {
      updates.destinationUrl = destinationUrl.trim();
    }

    const updated = await updateQRCode(id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/qrcodes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update QR code" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const success = await deleteQRCode(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "QR code not found or already deleted" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/qrcodes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete QR code" },
      { status: 500 }
    );
  }
}
