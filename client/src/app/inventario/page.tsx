"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/app/layout-wrapper";
import {
  Package,
  AlertCircle,
  Clock,
  Ban,
  Boxes,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function InventarioPage() {
  const [inventario, setInventario] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getInventario(), api.getLotes()])
      .then(([invData, lotesData]) => {
        setInventario(invData);
        setLotes(lotesData);
      })
      .finally(() => setLoading(false));
  }, []);

  const jabasPorVencer = lotes
    .filter((l) => l.estado === "por_vencer")
    .reduce((s, l) => s + l.jabas_restantes, 0);

  const jabasVencidas = lotes
    .filter((l) => l.estado === "vencido")
    .reduce((s, l) => s + l.jabas_restantes, 0);

  const totalJabasDisponibles = inventario.reduce(
    (sum, item) => sum + (item.disponible_jabas || 0),
    0
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <Boxes className="w-6 h-6 text-emerald-600" />
              Control de Almacén & Lotes
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoreo de existencias físicas y trazabilidad de caducidad por lote
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>{totalJabasDisponibles} Jabas Totales en Stock</span>
            </div>
          </div>
        </div>

        {/* Quality Stock Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventario.map((item) => {
            const hasStock = item.disponible_jabas > 0;
            return (
              <Card
                key={item.calidad_id}
                className="hover:border-slate-300 transition-all duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {item.huevos_por_jaba} huevos/jaba
                      </Badge>
                      <h3 className="font-extrabold text-slate-900 text-lg">
                        {item.calidad_nombre}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span
                          className={`text-3xl font-black ${
                            hasStock ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {item.disponible_jabas}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          jabas disp.
                        </span>
                      </div>
                    </div>
                    <div
                      className={`p-3 rounded-2xl ${
                        hasStock ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {hasStock ? (
                        <Package className="w-6 h-6" />
                      ) : (
                        <AlertCircle className="w-6 h-6" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Compradas</span>
                      <span className="font-bold text-slate-700">
                        {item.total_compradas_jabas} jabas
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Vendidas</span>
                      <span className="font-bold text-slate-700">
                        {item.total_vendidas_jabas} jabas
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Rotas/Merma</span>
                      <span className="font-bold text-rose-600">
                        {item.total_rotas_jabas} jabas
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Precio Venta</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(item.precio_venta_jaba)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Expiry Metric 1 */}
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="warning" className="mb-2">Alerta FIFO</Badge>
                  <h3 className="font-extrabold text-amber-950 text-base">Por Vencer</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-amber-700">{jabasPorVencer}</span>
                    <span className="text-xs text-amber-800/70 font-medium">jabas</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-2">A &le; 3 días de caducar</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiry Metric 2 */}
          <Card className="border-rose-200 bg-rose-50/30">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="danger" className="mb-2">Crítico</Badge>
                  <h3 className="font-extrabold text-rose-950 text-base">Vencidas</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-rose-700">{jabasVencidas}</span>
                    <span className="text-xs text-rose-800/70 font-medium">jabas</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-2">No aptas para despacho</p>
                </div>
                <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                  <Ban className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Chart Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              Balance de Jabas Disponibles vs Vendidas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={inventario}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="calidad_nombre" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-lg text-xs space-y-1">
                            <p className="font-bold text-slate-900">{label}</p>
                            {payload.map((p: any) => (
                              <div key={p.name} className="flex justify-between gap-4">
                                <span className="text-slate-600">{p.name}:</span>
                                <span className="font-bold text-slate-900">{p.value} jabas</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="disponible_jabas" fill="#059669" name="Jabas Disponibles" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="total_vendidas_jabas" fill="#0284c7" name="Jabas Vendidas" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lotes & Vencimiento Tracking Table */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Seguimiento de Lotes y Caducidad</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Control de rotación de inventario con base en fechas de compra y conservación
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lotes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
                <p className="font-semibold text-slate-600">No hay lotes con saldo pendiente</p>
                <p className="text-xs mt-1">Todos los lotes han sido despachados en su totalidad.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote #</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead>Jabas Restantes</TableHead>
                    <TableHead>Vencimiento Sugerido</TableHead>
                    <TableHead>Vencimiento Límite</TableHead>
                    <TableHead>Estado del Lote</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotes.map((l) => (
                    <TableRow key={l.compra_id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-500">
                        #{l.compra_id}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {l.calidad_nombre}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(l.fecha_compra)}
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-900 text-sm">
                        {l.jabas_restantes} jabas
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(l.fecha_vencimiento_min)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(l.fecha_vencimiento_max)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            l.estado === "vigente"
                              ? "success"
                              : l.estado === "por_vencer"
                              ? "warning"
                              : "danger"
                          }
                          dot
                        >
                          {l.estado === "vigente"
                            ? "Vigente"
                            : l.estado === "por_vencer"
                            ? "Por Vencer"
                            : "Vencido"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
