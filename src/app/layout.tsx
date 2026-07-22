import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UiThemeProvider } from "@/components/theme/ui-theme-provider";

export const metadata: Metadata = {
  title: { default: "Aula — studiare insieme, davvero", template: "%s · Aula" },
  description: "Un'aula studio privata e condivisa, con progressi, timer e presenza in tempo reale.",
  applicationName: "Aula",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/aula-app-icon.png", type: "image/png", sizes: "1254x1254" }],
    shortcut: "/aula-app-icon.png",
    apple: "/aula-app-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f1",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" data-ui-theme="classic" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("aula-ui-theme");if(t==="futuristic-focus"||t==="classic"){document.documentElement.dataset.uiTheme=t;document.documentElement.style.colorScheme=t==="futuristic-focus"?"dark":"light"}}catch(e){}` }} />
      </head>
      <body><UiThemeProvider>{children}</UiThemeProvider></body>
    </html>
  );
}
