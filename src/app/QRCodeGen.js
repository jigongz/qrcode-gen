"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  QrCode,
  Link2,
  ExternalLink,
  Copy,
  Check,
  Pencil,
  Trash2,
  Download,
  RefreshCw,
  Search,
  Sparkles,
  Eye,
  Info,
  ShieldCheck,
  Activity,
  ArrowRight,
} from "lucide-react";
import {
  generateQRDataUrl,
  generateQRSvg,
  downloadDataUrl,
  downloadSvg,
} from "@/lib/qr-client";

// Clean curated presets (no noisy AI slop gradients)
const COLOR_PRESETS = [
  { name: "Monolith Onyx", hex: "#09090b" },
  { name: "Deep Ink", hex: "#1e1b4b" },
  { name: "Slate Navy", hex: "#0f172a" },
  { name: "Forest Pine", hex: "#064e3b" },
];

export default function QRCodeGen() {
  // State for QR list
  const [qrCodes, setQrCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const [qrType, setQrType] = useState("dynamic"); // 'dynamic' | 'static'
  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("https://");
  const [fgColor, setFgColor] = useState("#09090b");
  const [correctionLevel, setCorrectionLevel] = useState("M");

  // Generator Live Preview Data URL
  const [livePreviewUrl, setLivePreviewUrl] = useState("");

  // Search & Filter in Table
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'dynamic' | 'static'

  // Edit Dynamic QR Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const [editName, setEditName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Preview / Export Modal State
  const [previewModalItem, setPreviewModalItem] = useState(null);
  const [modalDataUrl, setModalDataUrl] = useState("");

  // Copy feedback state tracker
  const [copiedId, setCopiedId] = useState(null);

  // Toast auto-clear
  const showToast = useCallback((msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Fetch QR codes from data.json via API
  const fetchQRCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/qrcodes");
      const json = await res.json();
      if (json.success) {
        setQrCodes(json.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch QR codes:", error);
      showToast("Gagal memuat data QR Code dari server", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  // Live Preview generator
  useEffect(() => {
    let isCancelled = false;
    async function updatePreview() {
      const textToEncode =
        destinationUrl && destinationUrl.trim() !== "https://" && destinationUrl.trim() !== ""
          ? destinationUrl.trim()
          : "https://antigravity.dev";

      const dataUrl = await generateQRDataUrl(textToEncode, {
        width: 320,
        margin: 2,
        fgColor,
        bgColor: "#ffffff",
        correctionLevel,
      });

      if (!isCancelled) {
        setLivePreviewUrl(dataUrl);
      }
    }

    updatePreview();
    return () => {
      isCancelled = true;
    };
  }, [destinationUrl, fgColor, correctionLevel]);

  // Handle Form Submission: Create new QR code
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!destinationUrl || !destinationUrl.trim() || destinationUrl === "https://") {
      showToast("Masukkan URL atau teks tujuan yang valid", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/qrcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || (qrType === "dynamic" ? "Dynamic QR Code" : "Static QR Code"),
          destinationUrl: destinationUrl.trim(),
          type: qrType,
          fgColor,
          bgColor: "#ffffff",
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          qrType === "dynamic"
            ? "Dynamic QR berhasil dibuat dan disimpan ke data.json!"
            : "Static QR berhasil dibuat dan disimpan!"
        );
        // Reset form to clean defaults
        setName("");
        setDestinationUrl("https://");
        // Reload list
        fetchQRCodes();
      } else {
        showToast(json.error || "Gagal membuat QR Code", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan koneksi server", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal for Dynamic QR
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditUrl(item.destinationUrl || "");
    setEditName(item.name || "");
  };

  // Save Edit for Dynamic QR (Updates Destination URL in data.json)
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!editUrl.trim()) {
      showToast("URL tujuan tidak boleh kosong", "error");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/qrcodes/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          destinationUrl: editUrl.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("URL tujuan berhasil diperbarui! Gambar QR tetap sama.");
        setEditingItem(null);
        fetchQRCodes();
      } else {
        showToast(json.error || "Gagal memperbarui QR code", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Gagal menyimpan perubahan", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete QR Code
  const handleDelete = async (id, title) => {
    if (!confirm(`Hapus QR code "${title}" dari data.json?`)) return;

    try {
      const res = await fetch(`/api/qrcodes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("QR code berhasil dihapus dari data.json");
        setQrCodes((prev) => prev.filter((item) => item.id !== id));
      } else {
        showToast(json.error || "Gagal menghapus", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi error saat menghapus", "error");
    }
  };

  // Quick download helper for item
  const handleDownloadItem = async (item, format = "png") => {
    const textToEncode = item.type === "dynamic" ? item.encodedUrl : item.destinationUrl;
    const filename = `${item.name.replace(/[^a-z0-9_-]/gi, "_")}_${item.type}.${format}`;

    if (format === "png") {
      const dataUrl = await generateQRDataUrl(textToEncode, {
        width: 1024,
        margin: 2,
        fgColor: item.fgColor || "#09090b",
        bgColor: item.bgColor || "#ffffff",
      });
      downloadDataUrl(dataUrl, filename);
    } else {
      const svg = await generateQRSvg(textToEncode, {
        margin: 2,
        fgColor: item.fgColor || "#09090b",
        bgColor: item.bgColor || "#ffffff",
      });
      downloadSvg(svg, filename);
    }
    showToast(`QR Code diunduh sebagai ${format.toUpperCase()}`);
  };

  // Open Preview Modal
  const handleOpenPreview = async (item) => {
    setPreviewModalItem(item);
    const textToEncode = item.type === "dynamic" ? item.encodedUrl : item.destinationUrl;
    const url = await generateQRDataUrl(textToEncode, {
      width: 480,
      margin: 2,
      fgColor: item.fgColor || "#09090b",
      bgColor: item.bgColor || "#ffffff",
    });
    setModalDataUrl(url);
  };

  // Copy to clipboard
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Link disalin ke clipboard!");
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Filtered list
  const filteredQRCodes = useMemo(() => {
    return qrCodes.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.destinationUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        filterType === "all" || item.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [qrCodes, searchQuery, filterType]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-200 ${toastMessage.type === "error"
            ? "bg-destructive text-white border-destructive"
            : "bg-foreground text-background border-foreground/20"
            }`}
        >
          {toastMessage.type === "error" ? (
            <Info className="size-4 shrink-0" />
          ) : (
            <Check className="size-4 shrink-0 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header / Top Branding */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background shadow-xs">
              <QrCode className="size-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              QR Code Studio
            </h1>
            <Badge variant="outline" className="text-xs font-mono font-medium py-0.5 px-2">
              Anti AI-Slop
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Generator QR Code Static & Dynamic
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-md border border-border/60">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{qrCodes.length} QR Terdaftar</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQRCodes}
            disabled={isLoading}
            className="h-8 gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
        </div>
      </header>

      {/* Grid containing 2 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================
            CARD 1: QR CODE GENERATOR CARD
            ======================================================== */}
        <Card className="lg:col-span-5 shadow-xs border border-border/90 bg-card rounded-xl overflow-hidden">
          <CardHeader className="space-y-1 border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Sparkles className="size-4 text-foreground/80" />
                QR Code Generator
              </CardTitle>
              <Badge
                variant={qrType === "dynamic" ? "default" : "secondary"}
                className="text-xs capitalize font-medium"
              >
                {qrType === "dynamic" ? "Dynamic QR" : "Static QR"}
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Pilih mode pembuatan QR code sesuai kebutuhan distribusi Anda.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleCreate}>
            <CardContent className="space-y-5 pt-5">
              {/* Type Switcher Segmented Control */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">
                  Pilih Tipe QR Code
                </Label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted/70 rounded-lg border border-border/60">
                  <button
                    type="button"
                    onClick={() => setQrType("dynamic")}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-md text-left transition-all ${qrType === "dynamic"
                      ? "bg-background text-foreground shadow-xs font-medium border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                      }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="flex size-1.5 rounded-full bg-emerald-500" />
                      Dynamic QR
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      URL bisa diganti kapan saja
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrType("static")}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-md text-left transition-all ${qrType === "static"
                      ? "bg-background text-foreground shadow-xs font-medium border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                      }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="flex size-1.5 rounded-full bg-zinc-400" />
                      Static QR
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      Link permanen & offline
                    </span>
                  </button>
                </div>

                {/* Educational Banner for Dynamic vs Static */}
                <div className="p-2.5 rounded-md bg-muted/40 border border-border/60 text-xs text-muted-foreground space-y-1">
                  {qrType === "dynamic" ? (
                    <p className="flex items-start gap-1.5">
                      <Activity className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Kelebihan Dynamic:</strong> QR code
                        mengarah ke redirect link. Jika URL tujuan berubah nanti, Anda cukup
                        mengeditnya di tabel tanpa perlu mencetak ulang QR code fisik!
                      </span>
                    </p>
                  ) : (
                    <p className="flex items-start gap-1.5">
                      <ShieldCheck className="size-3.5 text-foreground/70 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">Karakteristik Static:</strong> Teks / URL
                        ditanam langsung ke matriks QR. Bekerja mandiri tanpa server redirect, tetapi
                        tidak dapat diedit setelah dibuat.
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Form Input: Name / Label */}
              <div className="space-y-1.5">
                <Label htmlFor="qr-name" className="text-xs font-medium text-foreground">
                  Nama / Label QR Code
                </Label>
                <Input
                  id="qr-name"
                  type="text"
                  placeholder="Contoh: Brosur Promo, Menu Kafe, Portfolio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Form Input: Destination URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="qr-url" className="text-xs font-medium text-foreground">
                    URL Tujuan (Destination)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Wajib</span>
                </div>
                <div className="relative">
                  <Link2 className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="qr-url"
                    type="text"
                    required
                    placeholder="https://contoh-link-anda.com"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className="h-9 pl-9 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Customization: Color Presets & Error Correction */}
              <div className="space-y-2 pt-1 border-t border-border/40">
                <Label className="text-xs font-medium text-foreground">Pilihan Warna QR</Label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setFgColor(color.hex)}
                      className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-all ${fgColor === color.hex
                        ? "border-foreground bg-muted font-medium text-foreground"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                        }`}
                    >
                      <span
                        className="size-3 rounded-full border border-black/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Interactive Preview Box */}
              <div className="p-4 rounded-lg border border-border/80 bg-muted/20 flex flex-col items-center justify-center space-y-3">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Live Preview
                </span>
                <div className="relative p-2.5 bg-white rounded-lg border border-border shadow-xs">
                  {livePreviewUrl ? (
                    <img
                      src={livePreviewUrl}
                      alt="Live Preview QR"
                      className="size-40 sm:size-44 object-contain rounded"
                    />
                  ) : (
                    <div className="size-40 flex items-center justify-center text-xs text-muted-foreground">
                      Rendering...
                    </div>
                  )}
                </div>
                <div className="text-center space-y-0.5 max-w-xs">
                  <p className="text-xs font-medium text-foreground truncate">
                    {name || "Pratinjau QR Code"}
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">
                    {destinationUrl || "https://..."}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2 border-t border-border/60 bg-muted/10 p-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex-1 h-9 bg-foreground text-background hover:bg-foreground/90 font-medium active:scale-[0.98] transition-transform cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin mr-1.5" />
                    Menyimpan ke data.json...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-1.5" />
                    Simpan & Buat QR Code
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* ========================================================
            CARD 2: QR CODE TABLE & LIBRARY CARD
            ======================================================== */}
        <Card className="lg:col-span-7 shadow-xs border border-border/90 bg-card rounded-xl overflow-hidden">
          <CardHeader className="space-y-3 border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <QrCode className="size-4 text-foreground/80" />
                  Daftar QR Code Tersimpan
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Semua data tersimpan secara persisten di file{" "}
                  <code className="font-mono text-foreground">data.json</code>
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs font-normal">
                  {filteredQRCodes.length} dari {qrCodes.length} QR
                </Badge>
              </div>
            </div>

            {/* Filter Pills and Search */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Cari berdasarkan nama atau URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              <div className="flex items-center gap-1 bg-muted/80 p-0.5 rounded-lg border border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${filterType === "all"
                    ? "bg-background text-foreground shadow-xs font-medium"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("dynamic")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${filterType === "dynamic"
                    ? "bg-background text-foreground shadow-xs font-medium"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Dynamic
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("static")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${filterType === "static"
                    ? "bg-background text-foreground shadow-xs font-medium"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Static
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Table Area */}
            <div className="overflow-x-auto min-h-[320px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-border/80">
                    <TableHead className="w-[60px] text-xs font-medium">QR</TableHead>
                    <TableHead className="text-xs font-medium">Nama & Tipe</TableHead>
                    <TableHead className="text-xs font-medium min-w-[180px]">
                      URL Tujuan
                    </TableHead>
                    <TableHead className="text-xs font-medium min-w-[120px]">
                      Link / Redirect
                    </TableHead>
                    <TableHead className="text-xs font-medium text-center">Scan</TableHead>
                    <TableHead className="text-xs font-medium text-right pr-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                        <RefreshCw className="size-4 animate-spin mx-auto mb-2 text-foreground/60" />
                        Memuat data dari data.json...
                      </TableCell>
                    </TableRow>
                  ) : filteredQRCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-xs text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-1.5">
                          <QrCode className="size-8 text-muted-foreground/40" />
                          <p className="font-medium text-foreground">Belum ada QR Code</p>
                          <p className="text-[11px] text-muted-foreground max-w-xs">
                            {searchQuery
                              ? "Tidak ada QR Code yang cocok dengan filter pencarian Anda."
                              : "Gunakan formulir di card sebelah kiri untuk membuat QR Code pertama Anda."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQRCodes.map((item) => {
                      const isDynamic = item.type === "dynamic";
                      const isCopied = copiedId === item.id;

                      return (
                        <TableRow
                          key={item.id}
                          className="hover:bg-muted/30 transition-colors border-b border-border/40"
                        >
                          {/* QR Thumbnail */}
                          <TableCell className="py-3">
                            <button
                              type="button"
                              onClick={() => handleOpenPreview(item)}
                              title="Klik untuk perbesar & unduh"
                              className="group relative flex size-10 items-center justify-center rounded-md border border-border/80 bg-white p-1 hover:border-foreground transition-all cursor-pointer shadow-2xs"
                            >
                              <QrCode className="size-5 text-zinc-800 group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 rounded-md transition-opacity flex items-center justify-center">
                                <Eye className="size-3 text-foreground" />
                              </div>
                            </button>
                          </TableCell>

                          {/* Name & Type Badge */}
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold text-foreground line-clamp-1">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-1.5">
                                {isDynamic ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 font-medium"
                                  >
                                    <span className="size-1 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                                    Dynamic (Editable)
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 text-zinc-500 bg-zinc-100 dark:bg-zinc-800"
                                  >
                                    Static
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Destination URL */}
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 max-w-[220px]">
                                <a
                                  href={item.destinationUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-mono text-foreground hover:underline truncate"
                                  title={item.destinationUrl}
                                >
                                  {item.destinationUrl}
                                </a>
                                <a
                                  href={item.destinationUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-muted-foreground hover:text-foreground shrink-0"
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              </div>

                              {isDynamic && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Pencil className="size-2.5" />
                                  <span>Ganti URL Tujuan</span>
                                </button>
                              )}
                            </div>
                          </TableCell>

                          {/* Redirect / QR Link */}
                          <TableCell className="py-3">
                            {isDynamic ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="text-[11px] font-mono text-muted-foreground truncate max-w-[120px]"
                                  title={item.encodedUrl}
                                >
                                  {item.encodedUrl
                                    ? item.encodedUrl.replace(/^https?:\/\/[^/]+/, "")
                                    : `/r/${item.id}`}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() =>
                                    handleCopy(item.encodedUrl || `${window.location.origin}/r/${item.id}`, item.id)
                                  }
                                  title="Salin shortlink dynamic"
                                  className="size-6 cursor-pointer active:scale-90 transition-transform"
                                >
                                  {isCopied ? (
                                    <Check className="size-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="size-3 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                Direct Link
                              </span>
                            )}
                          </TableCell>

                          {/* Scan Counter */}
                          <TableCell className="py-3 text-center">
                            {isDynamic ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 text-xs font-mono font-medium">
                                <Activity className="size-3 text-emerald-600 dark:text-emerald-400" />
                                <span>{item.scanCount || 0}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Direct</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3 text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
                              {/* If dynamic, prominent Edit URL button */}
                              {isDynamic && (
                                <Button
                                  variant="outline"
                                  size="icon-xs"
                                  onClick={() => handleOpenEdit(item)}
                                  title="Ganti URL Tujuan (Dynamic)"
                                  className="size-7 cursor-pointer hover:bg-muted"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                              )}

                              {/* Download PNG */}
                              <Button
                                variant="outline"
                                size="icon-xs"
                                onClick={() => handleDownloadItem(item, "png")}
                                title="Unduh PNG"
                                className="size-7 cursor-pointer hover:bg-muted"
                              >
                                <Download className="size-3.5" />
                              </Button>

                              {/* Delete button */}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleDelete(item.id, item.name)}
                                title="Hapus dari data.json"
                                className="size-7 cursor-pointer hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/60 bg-muted/10 p-3 px-4 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>
              <strong>Tips Dynamic QR:</strong> Anda dapat mengganti link tujuan kapan saja
              dengan tombol pensil <Pencil className="inline size-3 mx-0.5" />.
            </span>
            <span className="font-mono text-[11px]">
              Tersinkronisasi otomatis dengan server
            </span>
          </CardFooter>
        </Card>
      </div>

      {/* ========================================================
          DIALOG: EDIT DYNAMIC QR DESTINATION URL
          ======================================================== */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4" />
              Ganti URL Tujuan Dynamic QR
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Perubahan URL ini tidak akan merusak atau mengubah gambar QR code yang sudah Anda
              cetak atau sebarkan. Pengguna yang memindai QR code akan langsung diarahkan ke link baru.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-2">
              {/* Shortlink Info Box */}
              <div className="p-3 bg-muted/50 rounded-lg border border-border/60 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Link Redirect Tetap (Encoded):
                </span>
                <p className="text-xs font-mono text-foreground break-all">
                  {editingItem.encodedUrl || `/r/${editingItem.id}`}
                </p>
              </div>

              {/* Edit Name */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-medium">
                  Nama / Label
                </Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Edit Destination URL */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-url" className="text-xs font-medium">
                  URL Tujuan Baru (Destination)
                </Label>
                <div className="relative">
                  <Link2 className="absolute left-2.5 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="edit-url"
                    type="text"
                    required
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://link-baru-anda.com"
                    className="h-9 pl-9 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingItem(null)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isUpdating}
              onClick={handleSaveEdit}
              className="bg-foreground text-background hover:bg-foreground/90 font-medium cursor-pointer active:scale-95 transition-transform"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin mr-1.5" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          DIALOG: PREVIEW & DOWNLOAD MODAL
          ======================================================== */}
      <Dialog
        open={!!previewModalItem}
        onOpenChange={(open) => !open && setPreviewModalItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-4" />
              Detail & Unduh QR Code
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {previewModalItem?.name}
            </DialogDescription>
          </DialogHeader>

          {previewModalItem && (
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div className="p-3 bg-white rounded-xl border border-border shadow-xs">
                {modalDataUrl ? (
                  <img
                    src={modalDataUrl}
                    alt={previewModalItem.name}
                    className="size-56 object-contain rounded"
                  />
                ) : (
                  <div className="size-56 flex items-center justify-center text-xs text-muted-foreground">
                    Memuat gambar...
                  </div>
                )}
              </div>

              <div className="w-full space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Tipe QR:</span>
                  <Badge variant={previewModalItem.type === "dynamic" ? "default" : "secondary"}>
                    {previewModalItem.type}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground">URL Tujuan:</span>
                  <span className="font-mono text-foreground truncate max-w-[200px]" title={previewModalItem.destinationUrl}>
                    {previewModalItem.destinationUrl}
                  </span>
                </div>
                {previewModalItem.type === "dynamic" && (
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Total Pindai (Scans):</span>
                    <span className="font-mono font-semibold text-foreground">
                      {previewModalItem.scanCount || 0} kali
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDownloadItem(previewModalItem, "svg")}
              className="flex-1 cursor-pointer"
            >
              <Download className="size-3.5 mr-1.5" />
              Unduh SVG (Vector)
            </Button>
            <Button
              type="button"
              onClick={() => handleDownloadItem(previewModalItem, "png")}
              className="flex-1 bg-foreground text-background hover:bg-foreground/90 cursor-pointer active:scale-95 transition-transform"
            >
              <Download className="size-3.5 mr-1.5" />
              Unduh PNG (HD)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}