import QRCode from "qrcode";

export async function generateQRDataUrl(text, options = {}) {
  try {
    if (!text) return "";
    return await QRCode.toDataURL(text, {
      width: options.width || 360,
      margin: options.margin !== undefined ? options.margin : 2,
      color: {
        dark: options.fgColor || "#09090b",
        light: options.bgColor || "#ffffff",
      },
      errorCorrectionLevel: options.correctionLevel || "M",
    });
  } catch (error) {
    console.error("Error generating QR Data URL:", error);
    return "";
  }
}

export async function generateQRSvg(text, options = {}) {
  try {
    if (!text) return "";
    return await QRCode.toString(text, {
      type: "svg",
      margin: options.margin !== undefined ? options.margin : 2,
      color: {
        dark: options.fgColor || "#09090b",
        light: options.bgColor || "#ffffff",
      },
      errorCorrectionLevel: options.correctionLevel || "M",
    });
  } catch (error) {
    console.error("Error generating QR SVG:", error);
    return "";
  }
}

export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadSvg(svgString, filename) {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
