import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-notification";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Huevos Fernando - Sistema de Gestión Avícola",
  description: "Sistema de gestión integral para negocio avícola de venta y distribución de huevos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

