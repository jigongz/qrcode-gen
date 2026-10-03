import { NextResponse } from "next/server";
import { readQRCodes, createQRCode } from "@/lib/qr-service";

export async function GET() {
  try {
    const qrcodes = await readQRCodes();
    return NextResponse.json({ success: true, data: qrcodes });
  } catch (error) {
    console.error("GET /api/qrcodes error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch QR codes" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, destinationUrl, type, fgColor, bgColor } = body;

    if (!destinationUrl || !destinationUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "Destination URL or text is required" },
        { status: 400 }
      );
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const origin = `${protocol}://${host}`;

    // Unique short id
    const id = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isDynamic = type === "dynamic";

    // For dynamic QR, the QR encodes the redirect endpoint on our domain
    // For static QR, the QR encodes the exact destination URL directly
    const encodedUrl = isDynamic ? `${origin}/r/${id}` : destinationUrl.trim();

    const newCode = await createQRCode({
      id,
      name: name?.trim() || (isDynamic ? "Dynamic QR Code" : "Static QR Code"),
      type: isDynamic ? "dynamic" : "static",
      destinationUrl: destinationUrl.trim(),
      encodedUrl,
      shortId: id,
      fgColor: fgColor || "#09090b",
      bgColor: bgColor || "#ffffff",
    });

    return NextResponse.json({ success: true, data: newCode }, { status: 201 });
  } catch (error) {
    console.error("POST /api/qrcodes error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create QR code" },
      { status: 500 }
    );
  }
}
