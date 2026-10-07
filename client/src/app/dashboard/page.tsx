"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/app/layout-wrapper";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  HandCoins,
  Users,
  Clock,
  Ban,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Layers,
  Egg,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Hourglass,
  Scale,
  ShoppingCart,
  HelpCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
} from "recharts";

const COLORS = ["#059669", "#f59e0b", "#0284c7", "#e11d48", "#8b5cf6"];

export default function DashboardPage() {
  const [resumen, setResumen] = useState<any>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [vencimientos, setVencimientos] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filtroCalidadLotes, setFiltroCalidadLotes] = useState<"todos" | "primera" | "cuarta">("todos");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      
      const [resumenData, vencimientosData] = await Promise.all([
        api.getResumen(params.toString()),
        api.getVencimientos().catch(() => null),
      ]);
      
      setResumen(resumenData);
      if (vencimientosData) {
        setVencimientos(vencimientosData);
      } else if (resumenData?.vencimientos) {
        setVencimientos(resumenData.vencimientos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lotes: any[] = vencimientos?.lotes || [];
  const jabasPorVencer = vencimientos?.jabas_por_vencer ?? 0;
  const jabasVencidas = vencimientos?.jabas_vencidas ?? 0;
  const jabasFrescas = vencimientos?.jabas_frescas ?? 0;
  const totalJabas = vencimientos?.total_jabas ?? 0;

  // Calidad info
  const resumenPrimera = vencimientos?.por_calidad?.find((p: any) => p.tipo === "primera");
  const resumenCuarta = vencimientos?.por_calidad?.find((p: any) => p.tipo === "cuarta");

  // Filtered lotes for table & chart
  const lotesFiltrados = lotes.filter((l) => {
    if (filtroCalidadLotes === "primera") return l.tipo_calidad === "primera";
    if (filtroCalidadLotes === "cuarta") return l.tipo_calidad === "cuarta";
    return true;
  });

  // Data for Expiration / Days Remaining Bar Chart
  const chartDataVencimientos = lotesFiltrados.map((l) => ({
    lote: `Lote #${l.compra_id}`,
    nombre: `${l.calidad_nombre} (#${l.compra_id})`,
    calidad: l.calidad_nombre,
    tipo: l.tipo_calidad,
    dias_transcurridos: l.dias_transcurridos,
    dias_restantes: Math.max(0, l.dias_restantes_promedio),
    dias_max: l.dias_conservacion_max,
    jabas_restantes: l.jabas_restantes,
    huevos_restantes: l.huevos_restantes,
    fecha_postura: l.fecha_postura ? formatDate(l.fecha_postura) : "-",
    estado: l.estado,
  }));

  // Data for Freshness Health Donut
  const chartDataFrescura = [
    { name: "Frescos / Óptimos", value: Number(jabasFrescas.toFixed(1)), color: "#10b981" },
    { name: "Por Vencer (≤ 5 días)", value: Number(jabasPorVencer.toFixed(1)), color: "#f59e0b" },
    { name: "Vencidos", value: Number(jabasVencidas.toFixed(1)), color: "#ef4444" },
  ].filter((item) => item.value > 0);

  const cards = [
    {
      title: "Ingresos Totales",
      value: formatCurrency(resumen?.ingresos_totales ?? 0),
      subtitle: "Ventas brutas registradas",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50/80 border-emerald-100",
      textCol: "text-emerald-700",
    },
    {
      title: "Inversión Total",
      value: formatCurrency(resumen?.inversion_total ?? 0),
      subtitle: "Costo total de compras",
      icon: TrendingDown,
      gradient: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50/80 border-amber-100",
      textCol: "text-amber-700",
    },
    {
      title: "Ganancia Neta",
      value: formatCurrency(resumen?.ganancia_neta ?? 0),
      subtitle: "Margen neto de rentabilidad",
      icon: DollarSign,
      gradient: (resumen?.ganancia_neta ?? 0) >= 0 ? "from-emerald-600 to-green-700" : "from-rose-500 to-red-600",
      bgLight: (resumen?.ganancia_neta ?? 0) >= 0 ? "bg-emerald-50/80 border-emerald-100" : "bg-rose-50/80 border-rose-100",
      textCol: (resumen?.ganancia_neta ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700",
    },
    {
      title: "Ingresos Cobrados",
      value: formatCurrency(resumen?.ingresos_cobrados ?? 0),
      subtitle: "Efectivo y abonos recibidos",
      icon: HandCoins,
      gradient: "from-teal-500 to-cyan-600",
      bgLight: "bg-teal-50/80 border-teal-100",
      textCol: "text-teal-700",
    },
    {
      title: "Cuentas por Cobrar",
      value: formatCurrency(resumen?.cuentas_por_cobrar ?? 0),
      subtitle: "Saldo pendiente en fiados",
      icon: Users,
      gradient: "from-amber-600 to-orange-700",
      bgLight: "bg-orange-50/80 border-orange-100",
      textCol: "text-orange-700",
    },
    {
      title: "Valor de Merma",
      value: formatCurrency(resumen?.valor_merma ?? 0),
      subtitle: "Pérdida por rotura en limpieza",
      icon: AlertTriangle,
      gradient: "from-rose-500 to-red-600",
      bgLight: "bg-rose-50/80 border-rose-100",
      textCol: "text-rose-700",
    },
    {
      title: "Jabas por Vencer",
      value: `${jabasPorVencer} jabas`,
      subtitle: "Próximas a expirar (≤ 5 días)",
      icon: Clock,
      gradient: "from-amber-500 to-yellow-600",
      bgLight: "bg-yellow-50/80 border-yellow-100",
      textCol: "text-yellow-800",
    },
    {
      title: "Jabas Vencidas",
      value: `${jabasVencidas} jabas`,
      subtitle: "Expiradas fuera de rango",
      icon: Ban,
      gradient: "from-red-600 to-rose-700",
      bgLight: "bg-red-50/80 border-red-100",
      textCol: "text-red-700",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Header & Date Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <span>Panel de Control Avícola</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                En vivo
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoreo financiero, compras registradas y control de vencimiento por postura
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">De:</span>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  aria-label="Fecha inicial de filtrado"
                  className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                />
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">A:</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  aria-label="Fecha final de filtrado"
                  className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <Button
              onClick={fetchData}
              disabled={loading}
              size="sm"
              className="gap-2 shadow-xs bg-slate-900 hover:bg-slate-800 text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Actualizando..." : "Filtrar"}</span>
            </Button>
          </div>
        </div>

        {/* Expiry Warning Banner if any */}
        {(jabasPorVencer > 0 || jabasVencidas > 0) && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Alerta de Rotación: Lotes próximos a vencer</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Hay {jabasPorVencer} jabas con menos de 5 días de vida útil y {jabasVencidas} jabas vencidas. Priorice su despacho según método FIFO.
                </p>
              </div>
            </div>
            <Link
              href="/ventas"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3.5 py-2 rounded-xl transition-colors shadow-xs"
            >
              <span>Vender con FIFO</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN DESTACADA: CONTROL DE CADUCIDAD Y CONTEO DE DÍAS POR VENCER      */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700">
                  <Egg className="w-5 h-5 text-emerald-600" />
                </span>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Control de Frescura & Conteo de Días por Vencer
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Monitoreo automático calculado a partir de la fecha de postura de cada compra registrada
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/compras"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>+ Registrar Nueva Compra</span>
              </Link>
            </div>
          </div>

          {/* Tarjetas comparativas de las 2 Calidades Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Huevo de Primera Calidad */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Huevo de Primera Calidad
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        30 días postura
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vencimiento fijo: <strong>30 días exactos</strong> desde la postura
                    </p>
                  </div>
                </div>

                <Badge
                  className={`text-xs font-bold ${
                    resumenPrimera?.estado_salud === "critico"
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : resumenPrimera?.estado_salud === "alerta"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  }`}
                >
                  {resumenPrimera?.estado_salud === "critico"
                    ? "Crítico"
                    : resumenPrimera?.estado_salud === "alerta"
                    ? "Por Vencer"
                    : "Frescura Óptima"}
                </Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 my-4 pt-3 border-t border-emerald-100">
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Días Restantes
                  </p>
                  <p className="text-2xl font-black text-emerald-700 mt-0.5">
                    {resumenPrimera?.cantidad_lotes > 0 ? `${resumenPrimera.dias_restantes_promedio}d` : "-"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {resumenPrimera?.cantidad_lotes > 0 ? "Promedio en almacén" : "Sin lotes activos"}
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Stock en Jabas
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    {resumenPrimera?.jabas_restantes ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    ~{(resumenPrimera?.huevos_restantes ?? 0).toLocaleString()} huevos
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Lotes Activos
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    {resumenPrimera?.cantidad_lotes ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {resumenPrimera?.jabas_por_vencer > 0 ? `${resumenPrimera.jabas_por_vencer} por vencer` : "100% vigentes"}
                  </p>
                </div>
              </div>

              {/* Countdown Progress Visualizer */}
              {resumenPrimera?.cantidad_lotes > 0 && (
                <div className="space-y-1.5 bg-white/60 p-3 rounded-xl border border-emerald-100/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Hourglass className="w-3.5 h-3.5 text-emerald-600" />
                      Vida Útil Restante:
                    </span>
                    <span className="font-extrabold text-emerald-800">
                      {Math.max(0, resumenPrimera.dias_restantes_promedio)} de 30 días restantes
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        resumenPrimera.dias_restantes_promedio <= 5
                          ? "bg-rose-500"
                          : resumenPrimera.dias_restantes_promedio <= 10
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(5, (resumenPrimera.dias_restantes_promedio / 30) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Postura (Día 0)</span>
                    <span>Consumo preferente (Día 15)</span>
                    <span>Vencimiento (Día 30)</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Huevo Manchado (Cuarta Calidad) */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/40 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                    <Egg className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Huevo Manchado (Cuarta Calidad)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                        21–30 días postura
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vencimiento promedio: <strong>21 a 30 días</strong> desde la postura
                    </p>
                  </div>
                </div>

                <Badge
                  className={`text-xs font-bold ${
                    resumenCuarta?.estado_salud === "critico"
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : resumenCuarta?.estado_salud === "alerta"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-amber-100 text-amber-900 border-amber-300"
                  }`}
                >
                  {resumenCuarta?.estado_salud === "critico"
                    ? "Crítico"
                    : resumenCuarta?.estado_salud === "alerta"
                    ? "Rotar Urgente"
                    : "Buen Estado"}
                </Badge>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 my-4 pt-3 border-t border-amber-100">
                <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Días Restantes
                  </p>
                  <p className="text-2xl font-black text-amber-700 mt-0.5">
                    {resumenCuarta?.cantidad_lotes > 0 ? `${resumenCuarta.dias_restantes_min}–${resumenCuarta.dias_restantes_max}d` : "-"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {resumenCuarta?.cantidad_lotes > 0 ? "Rango min-max estimado" : "Sin lotes activos"}
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Stock en Jabas
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    {resumenCuarta?.jabas_restantes ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    ~{(resumenCuarta?.huevos_restantes ?? 0).toLocaleString()} huevos
                  </p>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Lotes Activos
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    {resumenCuarta?.cantidad_lotes ?? 0}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {resumenCuarta?.jabas_por_vencer > 0 ? `${resumenCuarta.jabas_por_vencer} por vencer` : "100% vigentes"}
                  </p>
                </div>
              </div>

              {/* Countdown Progress Visualizer */}
              {resumenCuarta?.cantidad_lotes > 0 && (
                <div className="space-y-1.5 bg-white/60 p-3 rounded-xl border border-amber-100/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Hourglass className="w-3.5 h-3.5 text-amber-600" />
                      Vida Útil Restante:
                    </span>
                    <span className="font-extrabold text-amber-800">
                      {Math.max(0, resumenCuarta.dias_restantes_promedio)} días promedio (rango 21-30d)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        resumenCuarta.dias_restantes_promedio <= 5
                          ? "bg-rose-500"
                          : resumenCuarta.dias_restantes_promedio <= 10
                          ? "bg-amber-500"
                          : "bg-amber-400"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(5, (resumenCuarta.dias_restantes_promedio / 30) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Postura (Día 0)</span>
                    <span className="text-amber-700 font-semibold">Límite Mínimo (Día 21)</span>
                    <span className="text-rose-700 font-semibold">Límite Máximo (Día 30)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gráficas de Caducidad y Vida Útil */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfica 1: Conteo de Días Restantes por Lote y Calidad */}
            <Card className="lg:col-span-2 border-slate-200">
              <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Conteo de Días Restantes por Lote y Calidad
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Días transcurridos vs días restantes de frescura según fecha de postura
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setFiltroCalidadLotes("todos")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      filtroCalidadLotes === "todos" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Todos ({lotes.length})
                  </button>
                  <button
                    onClick={() => setFiltroCalidadLotes("primera")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      filtroCalidadLotes === "primera" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-emerald-700"
                    }`}
                  >
                    Primera (30d)
                  </button>
                  <button
                    onClick={() => setFiltroCalidadLotes("cuarta")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      filtroCalidadLotes === "cuarta" ? "bg-amber-500 text-white shadow-xs" : "text-slate-500 hover:text-amber-800"
                    }`}
                  >
                    Cuarta (21–30d)
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {chartDataVencimientos.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400">
                    <Egg className="w-12 h-12 stroke-[1.5] mb-2 opacity-30 text-amber-500" />
                    <p className="font-semibold text-slate-600">No hay lotes con stock para mostrar</p>
                    <p className="text-xs mt-1">Registre una compra para ver el conteo de días en vivo</p>
                  </div>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartDataVencimientos}
                        margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="lote"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(v) => `${v}d`}
                          domain={[0, 35]}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-xl text-xs space-y-2 animate-fade-in max-w-xs">
                                  <div className="flex items-center justify-between border-b pb-1.5">
                                    <span className="font-bold text-slate-900">{d.nombre}</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        d.estado === "vencido"
                                          ? "bg-rose-100 text-rose-800"
                                          : d.estado === "por_vencer"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-emerald-100 text-emerald-800"
                                      }`}
                                    >
                                      {d.estado === "vencido" ? "Vencido" : d.estado === "por_vencer" ? "Por Vencer" : "Fresco"}
                                    </span>
                                  </div>
                                  <div className="space-y-1 text-slate-600">
                                    <p>📅 <strong>Fecha postura:</strong> {d.fecha_postura}</p>
                                    <p>📦 <strong>Stock disponible:</strong> {d.jabas_restantes} jabas ({d.huevos_restantes} huevos)</p>
                                    <p className="text-emerald-700 font-bold">
                                      ⏳ <strong>Días restantes:</strong> {d.dias_restantes} días de frescura
                                    </p>
                                    <p className="text-slate-500">
                                      ⏱️ <strong>Días transcurridos:</strong> {d.dias_transcurridos} días desde postura
                                    </p>
                                    <p className="text-[11px] text-amber-700">
                                      🎯 <strong>Norma de vida:</strong> {d.tipo === "primera" ? "30 días" : "21 a 30 días"}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          height={32}
                          iconType="circle"
                          wrapperStyle={{ fontSize: "11px" }}
                        />
                        <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Límite 30d (1ra Calidad)", fill: "#059669", fontSize: 10, position: "top" }} />
                        <ReferenceLine y={21} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Min 21d (Cuarta/Manchado)", fill: "#d97706", fontSize: 10, position: "top" }} />
                        <Bar
                          dataKey="dias_transcurridos"
                          name="Días Transcurridos"
                          fill="#cbd5e1"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                        <Bar
                          dataKey="dias_restantes"
                          name="Días Restantes de Frescura"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        >
                          {chartDataVencimientos.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.estado === "vencido"
                                  ? "#ef4444"
                                  : entry.estado === "por_vencer"
                                  ? "#f59e0b"
                                  : entry.tipo === "primera"
                                  ? "#10b981"
                                  : "#f59e0b"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfica 2: Distribución de Jabas por Nivel de Frescura */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Salud del Almacén
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proporción de jabas según proximidad al vencimiento
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-56 w-full flex items-center justify-center">
                  {chartDataFrescura.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin inventario disponible</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartDataFrescura}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {chartDataFrescura.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value} jabas`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Frescos / Óptimos:
                    </span>
                    <span className="font-bold text-slate-900">{jabasFrescas} jabas</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Por Vencer (≤ 5 días):
                    </span>
                    <span className="font-bold text-amber-700">{jabasPorVencer} jabas</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Vencidos:
                    </span>
                    <span className="font-bold text-rose-700">{jabasVencidas} jabas</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla Detallada con Contador Regresivo por Lote */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Detalle de Lotes en Almacén con Conteo Regresivo
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conteo de días restantes actualizado para rotación de huevos por postura
                </p>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                Mostrando {lotesFiltrados.length} lotes con stock activo
              </span>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Lote #</th>
                    <th className="py-3 px-4">Calidad</th>
                    <th className="py-3 px-4">F. Postura</th>
                    <th className="py-3 px-4">Stock Restante</th>
                    <th className="py-3 px-4">Días Transcurridos</th>
                    <th className="py-3 px-4">Conteo de Días Restantes</th>
                    <th className="py-3 px-4">Barra de Vida Útil</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lotesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No hay lotes que coincidan con el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    lotesFiltrados.map((l) => {
                      const isPrimera = l.tipo_calidad === "primera";
                      const isCuarta = l.tipo_calidad === "cuarta";
                      
                      let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      let badgeText = "Fresco";
                      if (l.estado === "vencido") {
                        badgeColor = "bg-rose-100 text-rose-800 border-rose-200";
                        badgeText = "Vencido";
                      } else if (l.estado === "por_vencer") {
                        badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
                        badgeText = "Por Vencer";
                      }

                      return (
                        <tr key={l.compra_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            #{l.compra_id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {isPrimera ? (
                                <span className="p-1 rounded bg-emerald-100 text-emerald-700">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="p-1 rounded bg-amber-100 text-amber-700">
                                  <Egg className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <div>
                                <p className="font-bold text-slate-900">{l.calidad_nombre}</p>
                                <p className="text-[10px] text-slate-400">
                                  {isPrimera ? "Norma: 30 días" : isCuarta ? "Norma: 21–30 días" : "Estándar"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            <span className="font-medium text-slate-800">
                              {l.fecha_postura ? formatDate(l.fecha_postura) : formatDate(l.fecha_compra)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900">{l.jabas_restantes} jabas</span>
                            <span className="block text-[10px] text-slate-400">
                              ~{l.huevos_restantes.toLocaleString()} huevos
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            {l.dias_transcurridos} {l.dias_transcurridos === 1 ? "día" : "días"}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span
                                className={`font-black text-sm block ${
                                  l.dias_restantes_promedio <= 0
                                    ? "text-rose-600"
                                    : l.dias_restantes_promedio <= 5
                                    ? "text-amber-600"
                                    : "text-emerald-700"
                                }`}
                              >
                                {l.dias_restantes_promedio <= 0
                                  ? "Vencido"
                                  : isPrimera
                                  ? `Quedan ${l.dias_restantes_min} días`
                                  : `Quedan ${l.dias_restantes_min} a ${l.dias_restantes_max} días`}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Hasta {formatDate(l.fecha_vencimiento_max)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 min-w-36">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                <span>{l.porcentaje_vida}% transcurrido</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    l.porcentaje_vida >= 90
                                      ? "bg-rose-500"
                                      : l.porcentaje_vida >= 70
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(5, l.porcentaje_vida))}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeColor}`}
                            >
                              {badgeText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN FINANCIERA: RENTABILIDAD Y DISTRIBUCIÓN DE INGRESOS               */}
        {/* ========================================================================= */}
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Métricas Financieras & Desempeño
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingresos, inversiones y rentabilidad por tipo de calidad
            </p>
          </div>

          {/* 8 Primary Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className="relative overflow-hidden group hover:border-slate-300 transition-all duration-200"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {card.title}
                        </p>
                        <p className={`text-2xl font-extrabold tracking-tight ${card.textCol}`}>
                          {card.value}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {card.subtitle}
                        </p>
                      </div>
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Analytics Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Rentabilidad por Calidad
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comparativa de ingresos, inversión y ganancia neta
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={resumen?.ganancia_por_calidad || []}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="calidad_nombre"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(v) => `S/${v}`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl text-xs space-y-1.5 animate-fade-in">
                                <p className="font-bold text-slate-800">{label}</p>
                                {payload.map((p: any) => (
                                  <div key={p.name} className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
                                      {p.name}:
                                    </span>
                                    <span className="font-bold text-slate-900">
                                      {formatCurrency(Number(p.value))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="ingresos" fill="#059669" name="Ingresos" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="inversion" fill="#f59e0b" name="Inversión" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="ganancia" fill="#0284c7" name="Ganancia" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-amber-500" />
                    Distribución de Ingresos
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Participación porcentual por tipo de calidad
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-80 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resumen?.ganancia_por_calidad || []}
                        dataKey="ingresos"
                        nameKey="calidad_nombre"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        label={({ calidad_nombre, percent }) =>
                          `${calidad_nombre} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {(resumen?.ganancia_por_calidad || []).map((_: any, idx: number) => (
                          <Cell
                            key={idx}
                            fill={COLORS[idx % COLORS.length]}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
