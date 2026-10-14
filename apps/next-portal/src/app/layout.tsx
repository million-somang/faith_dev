import type { Metadata, Viewport } from "next";
import "./globals.css";
import React from "react";
import { PortalNavbar } from "@/components/layout/PortalNavbar";
import { PortalFooter } from "@/components/layout/PortalFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { AuthProvider } from "@/context/AuthContext";
import { UserPreferenceProvider } from "@/context/UserPreferenceContext";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://veranex.app"),
  title: {
    default: "VERA (베라) - 실시간 지식가이드 · 미니게임 · 생활도구 통합 라이프 포털",
    template: "%s | VERA",
  },
  description: "VERA에서 검증된 지식 가이드 25편, 무료 미니게임(베라 플라이트, 스도쿠, 2048, 지뢰찾기, 오목, 장기, 프리셀), 유용한 생활 계산기 및 금융 정보를 한곳에서 만나보세요.",
  keywords: ["VERA", "베라", "지식가이드", "미니게임", "베라플라이트", "스도쿠", "2048", "지뢰찾기", "프리셀", "오목", "장기", "만나이계산기", "평수변환기", "금융시세", "포털"],
  authors: [{ name: "VERA" }],
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "nRmVAkJwTuYV7_y9MRTl4pAJQSPPe1Mws852he0q_Ec",
  },
  openGraph: {
    type: "website",
    siteName: "VERA (베라)",
    title: "VERA - 대한민국 통합 라이프 포털",
    description: "검증된 지식 가이드, 인기 미니게임, 스마트 생활도구를 한곳에서 편하게 이용하세요.",
    url: "https://veranex.app/",
    locale: "ko_KR",
    images: [
      {
        url: "/logo-512.png",
        width: 512,
        height: 512,
        alt: "VERA 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VERA - 지식 가이드, 미니게임, 생활도구 포털",
    description: "검증된 지식 가이드, 미니게임, 생활도구를 한곳에서.",
    images: ["/logo-512.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-adsense-account" content="ca-pub-9041638273592776" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          precedence="default"
        />
      </head>
      <body className="bg-[#f5f6f7] min-h-screen text-gray-900 antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col">
        <AuthProvider>
          <UserPreferenceProvider>
            <PortalNavbar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <PortalFooter />
            <MobileTabBar />
          </UserPreferenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
