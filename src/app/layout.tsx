import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f2f4f6",
};

export const metadata: Metadata = {
  title: "임세은 | MyLink",
  description: "안녕하세요, 임세은이에요. 프로필 링크와 작업물을 한곳에서 볼 수 있어요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col justify-start items-center bg-[#f2f4f6]">
        {children}
      </body>
    </html>
  );
}
