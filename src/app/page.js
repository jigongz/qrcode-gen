import QRCodeGen from "./QRCodeGen";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background text-foreground flex flex-col items-center">
      <QRCodeGen />
    </main>
  );
}
