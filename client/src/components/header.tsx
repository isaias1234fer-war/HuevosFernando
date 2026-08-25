"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bell, 
  Calendar, 
  PlusCircle, 
  Menu, 
  User, 
  ShieldCheck, 
  LogOut,
  ChevronRight,
  TrendingUp,
  ShoppingCart
} from "lucide-react";
import { api } from "@/lib/api";

const pageTitles: Record<string, { title: string; category: string }> = {
  "/dashboard": { title: "Panel Principal", category: "Visión General" },
  "/ventas": { title: "Gestión de Ventas", category: "Operaciones" },
  "/compras": { title: "Registro de Compras", category: "Operaciones" },
  "/limpieza": { title: "Control de Limpieza y Merma", category: "Operaciones" },
  "/inventario": { title: "Control de Almacén y Lotes", category: "Inventario" },
  "/cuentas-cobrar": { title: "Cuentas por Cobrar", category: "Finanzas" },
  "/reportes": { title: "Reportes & Analítica", category: "Finanzas" },
};

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export function Header({ onToggleMobileSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("es-PE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    setCurrentDateStr(formatter.format(now));
  }, []);

  const currentPage = pageTitles[pathname] || { title: "Huevos Fernando", category: "Sistema" };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 sm:px-8 backdrop-blur-md transition-all">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            {currentPage.category}
          </span>
          <ChevronRight className="hidden sm:inline-block w-3.5 h-3.5 text-slate-300" />
          <h1 className="text-base font-bold text-slate-900 truncate">
            {currentPage.title}
          </h1>
        </div>
      </div>

      {/* Right: Date, Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-full">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span className="capitalize">{currentDateStr}</span>
        </div>

        {/* Quick Nav Links */}
        <div className="hidden sm:flex items-center gap-2">
          {pathname !== "/ventas" && (
            <button
              onClick={() => router.push("/ventas")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Venta</span>
            </button>
          )}
          {pathname !== "/compras" && (
            <button
              onClick={() => router.push("/compras")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Compra</span>
            </button>
          )}
        </div>

        {/* User Pill Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/80 transition-colors focus:outline-none"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm font-bold text-xs">
              HF
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">Admin</p>
              <p className="text-[10px] text-emerald-600 font-medium">Huevos Fernando</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setUserDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white p-1.5 shadow-xl border border-slate-100 z-50 animate-fade-in text-xs">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="font-semibold text-slate-900">Administrador</p>
                  <p className="text-slate-500 text-[11px]">Sistema de Gestión</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
