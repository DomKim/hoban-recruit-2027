import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://domkim.github.io/hoban-recruit-2027/"),
  title: "2027 호반그룹 신입사원 채용",
  description: "함께 그려가는 미래, 2027 호반그룹 신입사원 채용 키비주얼",
  openGraph: {
    title: "2027 호반그룹 신입사원 채용",
    description: "함께 그려가는 미래, 2027 호반그룹 신입사원 채용 키비주얼",
    images: [{ url: "/assets/hoban-final-approved.jpg", width: 1920, height: 1068 }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
