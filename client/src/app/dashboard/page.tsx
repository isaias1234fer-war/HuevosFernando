"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "recharts";

const COLORS = ["#059669", "#f59e0b", "#0284c7", "#e11d48", "#8b5cf6"];

export default function DashboardPage() {
  const [resumen, setResumen] = useState<any>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResumen = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      const data = await api.getResumen(params.toString());
      setResumen(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchResumen();
    api.getLotes().then(setLotes).catch(() => {});
  }, [fetchResumen]);

  const jabasPorVencer = lotes.filter((l) => l.estado === "por_vencer").reduce((s, l) => s + l.jabas_restantes, 0);
  const jabasVencidas = lotes.filter((l) => l.estado === "vencido").reduce((s, l) => s + l.jabas_restantes, 0);

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
      subtitle: "Pérdida por huevos rotos",
      icon: AlertTriangle,
      gradient: "from-rose-500 to-red-600",
      bgLight: "bg-rose-50/80 border-rose-100",
      textCol: "text-rose-700",
    },
    {
      title: "Jabas por Vencer",
      value: `${jabasPorVencer} jabas`,
      subtitle: "Próximas a expirar (≤ 3 días)",
      icon: Clock,
      gradient: "from-amber-500 to-yellow-600",
      bgLight: "bg-yellow-50/80 border-yellow-100",
      textCol: "text-yellow-800",
    },
    {
      title: "Jabas Vencidas",
      value: `${jabasVencidas} jabas`,
      subtitle: "Expiradas no aptas para venta",
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
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Resumen Ejecutivo
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoreo financiero y operativo en tiempo real
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
              onClick={fetchResumen}
              disabled={loading}
              size="sm"
              className="gap-2 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Actualizando..." : "Filtrar"}</span>
            </Button>
          </div>
        </div>

        {/* Expiry / Inventory Warning Banner if any */}
        {(jabasPorVencer > 0 || jabasVencidas > 0) && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Atención: Lotes con fecha de vencimiento crítica</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Hay {jabasPorVencer} jabas por vencer y {jabasVencidas} jabas vencidas en almacén.
                </p>
              </div>
            </div>
            <Link
              href="/inventario"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3 py-2 rounded-xl transition-colors"
            >
              <span>Ver en Inventario</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 8 Primary Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="relative overflow-hidden group hover:border-slate-300 transition-all duration-200">
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
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0`}>
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
    </AppLayout>
  );
}
