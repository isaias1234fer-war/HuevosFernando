"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import AppLayout from "@/app/layout-wrapper";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
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

const COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444"];

export default function ReportesPage() {
  const [resumen, setResumen] = useState<any>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [compras, setCompras] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);

  const fetchResumen = useCallback(async () => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    const data = await api.getResumen(params.toString());
    setResumen(data);
  }, [desde, hasta]);

  const fetchDetalle = useCallback(async () => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    const [comprasData, ventasData] = await Promise.all([
      api.getCompras(params.toString()),
      api.getVentas(params.toString()),
    ]);
    setCompras(comprasData);
    setVentas(ventasData);
  }, [desde, hasta]);

  useEffect(() => {
    fetchResumen();
    fetchDetalle();
  }, [fetchResumen, fetchDetalle]);

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
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
  };

  const exportJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reportes</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="desde">Desde</Label>
              <Input
                id="desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="hasta">Hasta</Label>
              <Input
                id="hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={() => { fetchResumen(); fetchDetalle(); }}>Actualizar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-orange-700">Inversión Total</span>
                  <span className="font-bold text-orange-700">
                    {formatCurrency(resumen?.inversion_total ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700">Ingresos Totales</span>
                  <span className="font-bold text-green-700">
                    {formatCurrency(resumen?.ingresos_totales ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700">Ganancia Neta</span>
                  <span className="font-bold text-blue-700">
                    {formatCurrency(resumen?.ganancia_neta ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700">Valor de Merma</span>
                  <span className="font-bold text-red-700">
                    {formatCurrency(resumen?.valor_merma ?? 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ganancia por Calidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resumen?.ganancia_por_calidad || []}
                      dataKey="ganancia"
                      nameKey="calidad_nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ calidad_nombre, percent }) =>
                        `${calidad_nombre} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {(resumen?.ganancia_por_calidad || []).map((_: any, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ganancia por Calidad (Detalle)</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(resumen?.ganancia_por_calidad || [], "ganancia-por-calidad")}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportJSON(resumen?.ganancia_por_calidad || [], "ganancia-por-calidad")}
                >
                  <FileText className="h-4 w-4 mr-1" /> JSON
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Ingresos</TableHead>
                  <TableHead>Inversión</TableHead>
                  <TableHead>Ganancia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(resumen?.ganancia_por_calidad || []).map((item: any) => (
                  <TableRow key={item.calidad_id}>
                    <TableCell className="font-medium">{item.calidad_nombre}</TableCell>
                    <TableCell>{formatCurrency(item.ingresos)}</TableCell>
                    <TableCell>{formatCurrency(item.inversion)}</TableCell>
                    <TableCell className="font-bold">{formatCurrency(item.ganancia)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Compras</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(compras.map((c: any) => ({
                    Fecha: formatDate(c.fecha),
                    Calidad: c.calidad.nombre,
                    Jabas: c.cantidad_jabas,
                    "Peso (kg)": Number(c.peso_total_kg).toFixed(2),
                    "Costo Total": Number(c.costo_total).toFixed(2),
                  })), "compras")}
                >
                  <Download className="h-4 w-4 mr-1" /> Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Jabas</TableHead>
                    <TableHead>Costo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compras.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell>{formatDate(c.fecha)}</TableCell>
                      <TableCell>{c.calidad.nombre}</TableCell>
                      <TableCell>{c.cantidad_jabas}</TableCell>
                      <TableCell>{formatCurrency(Number(c.costo_total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ventas</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCSV(ventas.map((v: any) => ({
                    Fecha: formatDate(v.fecha),
                    Calidad: v.calidad.nombre,
                    Jabas: v.cantidad_jabas,
                    Total: Number(v.total).toFixed(2),
                  })), "ventas")}
                >
                  <Download className="h-4 w-4 mr-1" /> Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                  {ventas.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell>{formatDate(v.fecha)}</TableCell>
                      <TableCell>{v.calidad.nombre}</TableCell>
                      <TableCell>{v.cantidad_jabas}</TableCell>
                      <TableCell>{formatCurrency(Number(v.total))}</TableCell>
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
