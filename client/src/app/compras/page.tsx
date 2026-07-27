"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import AppLayout from "@/app/layout-wrapper";

export default function ComprasPage() {
  const [calidades, setCalidades] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [calidadId, setCalidadId] = useState("");
  const [cantidadJabas, setCantidadJabas] = useState("");
  const [pesoTotal, setPesoTotal] = useState("");
  const [precioKg, setPrecioKg] = useState("");
  const [notas, setNotas] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtroCalidad, setFiltroCalidad] = useState("");

  const fetchCalidades = useCallback(async () => {
    const data = await api.getCalidades();
    setCalidades(data);
  }, []);

  const fetchCompras = useCallback(async () => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (filtroCalidad) params.set("calidad_id", filtroCalidad);
    const data = await api.getCompras(params.toString());
    setCompras(data);
  }, [desde, hasta, filtroCalidad]);

  useEffect(() => {
    fetchCalidades();
    fetchCompras();
  }, [fetchCalidades, fetchCompras]);

  const costoTotal = Number(pesoTotal) * Number(precioKg) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createCompra({
      calidad_id: parseInt(calidadId),
      cantidad_jabas: parseInt(cantidadJabas),
      peso_total_kg: pesoTotal,
      precio_por_kg: precioKg,
      notas,
    });
    setCantidadJabas("");
    setPesoTotal("");
    setPrecioKg("");
    setNotas("");
    fetchCompras();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Compras</h1>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Calidad</Label>
                <Select
                  value={calidadId}
                  onChange={(e) => setCalidadId(e.target.value)}
                  options={calidades.map((c) => ({
                    value: String(c.id),
                    label: c.nombre,
                  }))}
                  placeholder="Seleccionar calidad"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Cantidad (jabas)</Label>
                <Input
                  type="number"
                  value={cantidadJabas}
                  onChange={(e) => setCantidadJabas(e.target.value)}
                  required
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Peso Total (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={pesoTotal}
                  onChange={(e) => setPesoTotal(e.target.value)}
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio por kg (S/)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={precioKg}
                  onChange={(e) => setPrecioKg(e.target.value)}
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={notas} onChange={(e) => setNotas(e.target.value)} />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <p className="text-sm text-muted-foreground mb-1">
                  Costo total: <span className="font-bold text-lg">{formatCurrency(costoTotal)}</span>
                </p>
                <Button type="submit">Registrar Compra</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
              <Select
                value={filtroCalidad}
                onChange={(e) => setFiltroCalidad(e.target.value)}
                options={calidades.map((c) => ({ value: String(c.id), label: c.nombre }))}
                placeholder="Todas las calidades"
                className="w-48"
              />
              <Button onClick={fetchCompras}>Filtrar</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Jabas</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Precio/kg</TableHead>
                  <TableHead>Costo Total</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatDate(c.fecha)}</TableCell>
                    <TableCell>{c.calidad.nombre}</TableCell>
                    <TableCell>{c.cantidad_jabas}</TableCell>
                    <TableCell>{Number(c.peso_total_kg).toFixed(2)}</TableCell>
                    <TableCell>{formatCurrency(Number(c.precio_por_kg))}</TableCell>
                    <TableCell>{formatCurrency(Number(c.costo_total))}</TableCell>
                    <TableCell>{c.notas || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
