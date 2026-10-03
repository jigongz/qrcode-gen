import { NextResponse } from "next/server";
import { getQRCodeById, recordScan } from "@/lib/qr-service";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const qr = await getQRCodeById(id);

    if (!qr || !qr.destinationUrl) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>QR Code Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; color: #18181b; }
              .box { text-align: center; padding: 2.5rem; background: white; border-radius: 1rem; border: 1px solid #e4e4e7; max-width: 400px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
              h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
              p { font-size: 0.875rem; color: #71717a; margin-bottom: 1.5rem; }
              a { display: inline-block; padding: 0.5rem 1rem; background: #18181b; color: white; border-radius: 0.5rem; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>QR Code Not Found</h1>
              <p>This dynamic QR code may have expired or been removed by its creator.</p>
              <a href="/">Go to Generator</a>
            </div>
          </body>
        </html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Record scan asynchronously
    await recordScan(id);

    let target = qr.destinationUrl.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `https://${target}`;
    }

    return NextResponse.redirect(target, { status: 307 });
  } catch (error) {
    console.error("Redirect error in /r/[id]:", error);
    return NextResponse.redirect(new URL("/", request.url), { status: 307 });
  }
}
