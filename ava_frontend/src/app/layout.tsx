// src/app/layout.tsx (Ejemplo, si ya lo tienes similar, está bien)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { Toaster } from "@/components/ui/sonner"; // O el que uses

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AVA IA Test",
  description: "Probando enrutamiento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("RootLayout RENDERIZANDO...");
  return (
    <html lang="es">
      <body className={inter.className}>
        <div style={{ border: '5px solid green', padding: '20px', margin: '5px' }}>
          <h1>Root Layout Container</h1>
          {children}
        </div>
        {/* <Toaster richColors position="top-right" /> */}
      </body>
    </html>
  );
}