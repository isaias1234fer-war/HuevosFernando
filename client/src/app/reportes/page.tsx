"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast-notification";
import AppLayout from "@/app/layout-wrapper";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PieChart as PieChartIcon,
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

export default function ReportesPage() {
  const { success, error } = useToast();
  const [resumen, setResumen] = useState<any>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [compras, setCompras] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResumen = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      const data = await api.getResumen(params.toString());
      setResumen(data);
    } catch {
      error("Error al obtener resumen de reportes");
    }
  }, [desde, hasta, error]);

  const fetchDetalle = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      const [comprasData, ventasData] = await Promise.all([
        api.getCompras(params.toString()),
        api.getVentas(params.toString()),
      ]);
      setCompras(comprasData);
      setVentas(ventasData);
    } catch {
      error("Error al obtener detalle de transacciones");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, error]);

  useEffect(() => {
    fetchResumen();
    fetchDetalle();
  }, [fetchResumen, fetchDetalle]);

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      error("No hay datos disponibles para exportar");
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success(`Reporte ${filename}.csv exportado con éxito`);
  };

  const exportJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success(`Reporte ${filename}.json exportado`);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              Reportes & Auditoría Financiera
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Análisis consolidado de márgenes de utilidad, mermas y balances contables
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
                  aria-label="Fecha inicial"
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
                  aria-label="Fecha final"
                  className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                fetchResumen();
                fetchDetalle();
              }}
              disabled={loading}
              size="sm"
              className="gap-2 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Calculando..." : "Actualizar"}</span>
            </Button>
          </div>
        </div>

        {/* Financial Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/20">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Inversión Total
                </p>
                <p className="text-2xl font-black text-amber-700 mt-1">
                  {formatCurrency(resumen?.inversion_total ?? 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Costo de compra en el periodo</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                <TrendingDown className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ingresos Totales
                </p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {formatCurrency(resumen?.ingresos_totales ?? 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Ventas brutas acumuladas</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                <TrendingUp className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              (resumen?.ganancia_neta ?? 0) >= 0
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-rose-200 bg-rose-50/30"
            }
          >
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ganancia Neta
                </p>
                <p
                  className={`text-2xl font-black mt-1 ${
                    (resumen?.ganancia_neta ?? 0) >= 0 ? "text-emerald-800" : "text-rose-700"
                  }`}
                >
                  {formatCurrency(resumen?.ganancia_neta ?? 0)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Ingresos &minus; Inversión</p>
              </div>
              <div
                className={`p-3 rounded-2xl ${
                  (resumen?.ganancia_neta ?? 0) >= 0
                    ? "bg-emerald-200/80 text-emerald-900"
                    : "bg-rose-200/80 text-rose-900"
                }`}
              >
                <DollarSign className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-100 bg-gradient-to-br from-white to-rose-50/20">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Valor de Merma
                </p>
                <p className="text-2xl font-black text-rose-700 mt-1">
                  {formatCurrency(resumen?.valor_merma ?? 0)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Pérdida por rotura en limpieza</p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Desglose Financiero por Calidad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={resumen?.ganancia_por_calidad || []}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="calidad_nombre" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `S/${v}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="ingresos" fill="#059669" name="Ingresos" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="inversion" fill="#f59e0b" name="Inversión" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="ganancia" fill="#0284c7" name="Ganancia" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-amber-500" />
                Participación de Ganancia Neta
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resumen?.ganancia_por_calidad || []}
                      dataKey="ganancia"
                      nameKey="calidad_nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={50}
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

        {/* Ganancia por Calidad Detallada con exportación */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Detalle de Rendimiento por Calidad</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Márgenes y balance consolidado</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportCSV(resumen?.ganancia_por_calidad || [], "ganancia-por-calidad")
                }
                className="h-8 text-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" /> CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportJSON(resumen?.ganancia_por_calidad || [], "ganancia-por-calidad")
                }
                className="h-8 text-xs"
              >
                <FileText className="h-3.5 w-3.5 mr-1 text-blue-600" /> JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Ingresos Totales</TableHead>
                  <TableHead>Inversión en Compras</TableHead>
                  <TableHead>Ganancia Neta</TableHead>
                  <TableHead>Margen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(resumen?.ganancia_por_calidad || []).map((item: any) => {
                  const margen =
                    item.ingresos > 0 ? (item.ganancia / item.ingresos) * 100 : 0;
                  return (
                    <TableRow key={item.calidad_id}>
                      <TableCell className="font-bold text-slate-900">
                        {item.calidad_nombre}
                      </TableCell>
                      <TableCell className="text-emerald-700 font-semibold">
                        {formatCurrency(item.ingresos)}
                      </TableCell>
                      <TableCell className="text-amber-700 font-medium">
                        {formatCurrency(item.inversion)}
                      </TableCell>
                      <TableCell
                        className={`font-black ${
                          item.ganancia >= 0 ? "text-emerald-800" : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(item.ganancia)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-600">
                        {margen.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tablas de Auditoría de Compras y Ventas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compras Table Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Auditoría de Compras</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">{compras.length} registros</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportCSV(
                    compras.map((c: any) => ({
                      Lote: c.id,
                      Fecha: formatDate(c.fecha),
                      Calidad: c.calidad?.nombre,
                      Jabas: c.cantidad_jabas,
                      "Peso (kg)": Number(c.peso_total_kg).toFixed(2),
                      "Costo Total (S/)": Number(c.costo_total).toFixed(2),
                    })),
                    "auditoria-compras"
                  )
                }
                className="h-8 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Exportar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Jabas</TableHead>
                    <TableHead>Costo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compras.slice(0, 10).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(c.fecha)}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {c.calidad?.nombre}
                      </TableCell>
                      <TableCell className="text-slate-800 font-semibold">
                        {c.cantidad_jabas} jabas
                      </TableCell>
                      <TableCell className="font-bold text-amber-800">
                        {formatCurrency(Number(c.costo_total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Ventas Table Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Auditoría de Ventas</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">{ventas.length} registros</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  exportCSV(
                    ventas.map((v: any) => ({
                      Id: v.id,
                      Fecha: formatDate(v.fecha),
                      Calidad: v.calidad?.nombre,
                      Jabas: v.cantidad_jabas,
                      Tipo: v.tipo_pago,
                      Estado: v.estado_pago,
                      Total: Number(v.total).toFixed(2),
                    })),
                    "auditoria-ventas"
                  )
                }
                className="h-8 text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Exportar
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Jabas</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas.slice(0, 10).map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(v.fecha)}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {v.calidad?.nombre}
                      </TableCell>
                      <TableCell className="text-slate-800 font-semibold">
                        {v.cantidad_jabas} jabas
                      </TableCell>
                      <TableCell className="font-bold text-emerald-800">
                        {formatCurrency(Number(v.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
