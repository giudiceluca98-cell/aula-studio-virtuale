import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aula — studiare insieme, davvero", template: "%s · Aula" },
  description: "Un'aula studio privata e condivisa, con progressi, timer e presenza in tempo reale.",
  applicationName: "Aula",
};

export const viewport: Viewport = {
  themeColor: "#f7f6f1",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
