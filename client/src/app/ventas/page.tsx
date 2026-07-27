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

export default function VentasPage() {
  const [calidades, setCalidades] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [calidadId, setCalidadId] = useState("");
  const [cantidadJabas, setCantidadJabas] = useState("");
  const [precioPorJaba, setPrecioPorJaba] = useState("");
  const [notas, setNotas] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtroCalidad, setFiltroCalidad] = useState("");

  const fetchCalidades = useCallback(async () => {
    const data = await api.getCalidades();
    setCalidades(data);
  }, []);

  const fetchVentas = useCallback(async () => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (filtroCalidad) params.set("calidad_id", filtroCalidad);
    const data = await api.getVentas(params.toString());
    setVentas(data);
  }, [desde, hasta, filtroCalidad]);

  useEffect(() => {
    fetchCalidades();
    fetchVentas();
  }, [fetchCalidades, fetchVentas]);

  useEffect(() => {
    const selected = calidades.find((c) => String(c.id) === calidadId);
    if (selected) {
      setPrecioPorJaba(String(selected.precio_venta_jaba));
    }
  }, [calidadId, calidades]);

  const total = Number(cantidadJabas) * Number(precioPorJaba) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createVenta({
      calidad_id: parseInt(calidadId),
      cantidad_jabas: parseInt(cantidadJabas),
      precio_por_jaba: precioPorJaba,
      notas,
    });
    setCantidadJabas("");
    setPrecioPorJaba("");
    setNotas("");
    fetchVentas();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Ventas</h1>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Calidad</Label>
                <Select
                  value={calidadId}
                  onChange={(e) => { setCalidadId(e.target.value); }}
                  options={calidades.map((c) => ({
                    value: String(c.id),
                    label: `${c.nombre} - S/ ${c.precio_venta_jaba}/jaba`,
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
                <Label>Precio por jaba (S/)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={precioPorJaba}
                  onChange={(e) => setPrecioPorJaba(e.target.value)}
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
                  Total: <span className="font-bold text-lg">{formatCurrency(total)}</span>
                </p>
                <Button type="submit">Registrar Venta</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Ventas</CardTitle>
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
              <Button onClick={fetchVentas}>Filtrar</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Jabas</TableHead>
                  <TableHead>Precio/jaba</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{formatDate(v.fecha)}</TableCell>
                    <TableCell>{v.calidad.nombre}</TableCell>
                    <TableCell>{v.cantidad_jabas}</TableCell>
                    <TableCell>{formatCurrency(Number(v.precio_por_jaba))}</TableCell>
                    <TableCell>{formatCurrency(Number(v.total))}</TableCell>
                    <TableCell>{v.notas || "-"}</TableCell>
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
