import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import AppShell from "./AppShell";
import ServiceWorkerRegister from "./ServiceWorkerRegister";

const bricolage = Bricolage_Grotesque({
  variable: "--font-disp",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "체크리스트",
  description: "체크리스트",
  appleWebApp: {
    title: "체크리스트",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#4A5BA8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-theme="mist" className={bricolage.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
