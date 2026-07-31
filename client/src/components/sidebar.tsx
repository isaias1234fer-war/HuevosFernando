"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Package,
  BarChart3,
  LogOut,
  CreditCard,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/limpieza", label: "Limpieza", icon: Sparkles },
  { href: "/ventas", label: "Ventas", icon: TrendingUp },
  { href: "/cuentas-cobrar", label: "Ctas x Cobrar", icon: CreditCard },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await api.logout();
    router.push("/");
  };

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-8 px-2">
        <Image src="/logo.jpg" alt="Huevos Fernando" width={40} height={40} className="rounded-full object-cover" />
        <span className="font-bold text-lg">Huevos Fernando</span>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Button variant="ghost" className="justify-start gap-3 text-gray-600" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Cerrar Sesión
      </Button>
    </aside>
  );
}
