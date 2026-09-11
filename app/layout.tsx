import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axe Bobby · 可审计量化投研系统",
  description: "研究证据、风险状态、入场纪律与人工判断组成的可复算量化决策链。",
  openGraph: {
    title: "Axe Bobby · 可审计量化投研系统",
    description: "真实数据口径 · 量化证据分级 · 风险预算 · 人工确认",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Axe Bobby · 可审计量化投研系统",
    description: "真实数据口径 · 量化证据分级 · 风险预算 · 人工确认",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
