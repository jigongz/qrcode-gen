import fs from "fs/promises";
import path from "path";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "app", "data.json");

export async function readQRCodes() {
  try {
    const fileContent = await fs.readFile(DATA_FILE_PATH, "utf-8");
    if (!fileContent.trim()) {
      return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(DATA_FILE_PATH, "[]", "utf-8");
      return [];
    }
    console.error("Error reading data.json:", error);
    return [];
  }
}

export async function writeQRCodes(qrCodes) {
  try {
    await fs.writeFile(
      DATA_FILE_PATH,
      JSON.stringify(qrCodes, null, 2),
      "utf-8"
    );
    return true;
  } catch (error) {
    console.error("Error writing to data.json:", error);
    throw error;
  }
}

export async function getQRCodeById(id) {
  const codes = await readQRCodes();
  return codes.find((code) => code.id === id);
}

export async function createQRCode(data) {
  const codes = await readQRCodes();
  const newCode = {
    id: data.id || `qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name?.trim() || "Untitled QR Code",
    type: data.type === "dynamic" ? "dynamic" : "static",
    destinationUrl: data.destinationUrl?.trim() || "",
    encodedUrl: data.encodedUrl || "", // For dynamic, this is /r/[id]. For static, destinationUrl
    shortId: data.shortId || "",
    scanCount: 0,
    lastScannedAt: null,
    fgColor: data.fgColor || "#09090b",
    bgColor: data.bgColor || "#ffffff",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Prepend to show latest first
  codes.unshift(newCode);
  await writeQRCodes(codes);
  return newCode;
}

export async function updateQRCode(id, updates) {
  const codes = await readQRCodes();
  const index = codes.findIndex((c) => c.id === id);
  if (index === -1) {
    return null;
  }

  const existing = codes[index];

  // Dynamic QR codes can update destinationUrl. Both can update name if needed.
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // If it's static, destinationUrl and encodedUrl should stay in sync
  if (existing.type === "static" && updates.destinationUrl) {
    updated.encodedUrl = updates.destinationUrl;
  }

  codes[index] = updated;
  await writeQRCodes(codes);
  return updated;
}

export async function deleteQRCode(id) {
  const codes = await readQRCodes();
  const filtered = codes.filter((c) => c.id !== id);
  if (filtered.length === codes.length) {
    return false;
  }
  await writeQRCodes(filtered);
  return true;
}

export async function recordScan(id) {
  const codes = await readQRCodes();
  const item = codes.find((c) => c.id === id);
  if (!item) return null;

  item.scanCount = (item.scanCount || 0) + 1;
  item.lastScannedAt = new Date().toISOString();
  await writeQRCodes(codes);
  return item;
}
