"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import AppLayout from "@/app/layout-wrapper";

export default function LimpiezaPage() {
  const [comprasLimpieza, setComprasLimpieza] = useState<any[]>([]);
  const [limpiezas, setLimpiezas] = useState<any[]>([]);
  const [compraId, setCompraId] = useState("");
  const [huevosRotost, setHuevosRotost] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchData = useCallback(async () => {
    const calidades = await api.getCalidades();
    const limpiezaCalidades = calidades.filter((c: any) => c.requiere_limpieza);
    const ids = limpiezaCalidades.map((c: any) => c.id);

    if (ids.length > 0) {
      const params = ids.map((id: number) => `calidad_id=${id}`).join("&");
      const compras = await api.getCompras(params);
      const comprasSinLimpieza = compras.filter((c: any) => !c.limpieza);
      setComprasLimpieza(comprasSinLimpieza);
    }

    const limpiezaParams = new URLSearchParams();
    if (desde) limpiezaParams.set("desde", desde);
    if (hasta) limpiezaParams.set("hasta", hasta);
    const limpiezasData = await api.getLimpiezas(limpiezaParams.toString());
    setLimpiezas(limpiezasData);
  }, [desde, hasta]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createLimpieza({
      compra_id: parseInt(compraId),
      huevos_rotos: parseInt(huevosRotost),
      observaciones,
    });
    setCompraId("");
    setHuevosRotost("");
    setObservaciones("");
    fetchData();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Limpieza</h1>

        <Card>
          <CardHeader>
            <CardTitle>Registrar Limpieza</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Compra (solo calidad manchado)</Label>
                <Select
                  value={compraId}
                  onChange={(e) => setCompraId(e.target.value)}
                  options={comprasLimpieza.map((c: any) => ({
                    value: String(c.id),
                    label: `#${c.id} - ${c.calidad.nombre} - ${c.cantidad_jabas} jabas`,
                  }))}
                  placeholder="Seleccionar compra"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Huevos Rotos</Label>
                <Input
                  type="number"
                  value={huevosRotost}
                  onChange={(e) => setHuevosRotost(e.target.value)}
                  required
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit">Registrar Limpieza</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Limpieza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
              <Button onClick={fetchData}>Filtrar</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Compra #</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Huevos Rotos</TableHead>
                  <TableHead>Jabas Rotas Eq.</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limpiezas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{formatDate(l.fecha)}</TableCell>
                    <TableCell>{l.compra_id}</TableCell>
                    <TableCell>{l.compra.calidad.nombre}</TableCell>
                    <TableCell>{l.huevos_rotos}</TableCell>
                    <TableCell>{Number(l.jabas_rotas_equivalente).toFixed(2)}</TableCell>
                    <TableCell>{l.observaciones || "-"}</TableCell>
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
