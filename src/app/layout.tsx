import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "GitMirror - GitHub 搜索镜像站",
  description: "GitHub 搜索加速、镜像加速、趋势发现、AI 智能增强",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col relative">
        {/* Global background image */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            backgroundImage: "url(/context.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
          }}
        />
        {/* Content wrapper */}
        <SessionProvider>
          <div className="relative z-10 flex flex-col flex-1">{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}
