"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CreditCard } from "lucide-react";
import AppLayout from "@/app/layout-wrapper";

export default function CuentasCobrarPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [abonoVentaId, setAbonoVentaId] = useState<number | null>(null);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [abonoFecha, setAbonoFecha] = useState("");
  const [abonoNotas, setAbonoNotas] = useState("");

  const fetchVentas = useCallback(async () => {
    const data = await api.getVentas();
    const fiados = data.filter((v: any) => v.tipo_pago === "fiado" && Number(v.saldo_pendiente) > 0);
    fiados.sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    setVentas(fiados);
  }, []);

  useEffect(() => { fetchVentas(); }, [fetchVentas]);

  const handleAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonoVentaId) return;
    try {
      await api.createPago({
        venta_id: abonoVentaId,
        monto: abonoMonto,
        fecha: abonoFecha || undefined,
        notas: abonoNotas || undefined,
      });
      setAbonoVentaId(null);
      setAbonoMonto("");
      setAbonoFecha("");
      setAbonoNotas("");
      fetchVentas();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalPorCobrar = ventas.reduce((sum: number, v: any) => sum + Number(v.saldo_pendiente), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Cuentas por Cobrar</h1>
          <div className="bg-orange-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-orange-700">Total pendiente: </span>
            <span className="text-xl font-bold text-orange-700">{formatCurrency(totalPorCobrar)}</span>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {ventas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">No hay cuentas por cobrar</p>
                <p className="text-sm">Todas las ventas al fiado están al día</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Jabas</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{formatDate(v.fecha)}</TableCell>
                      <TableCell className="font-medium">{v.cliente || "Sin nombre"}</TableCell>
                      <TableCell>{v.calidad.nombre}</TableCell>
                      <TableCell>{v.cantidad_jabas}</TableCell>
                      <TableCell>{formatCurrency(Number(v.total))}</TableCell>
                      <TableCell className="font-bold text-red-600">{formatCurrency(Number(v.saldo_pendiente))}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${v.estado_pago === "pendiente" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{v.estado_pago}</span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => { setAbonoVentaId(v.id); setAbonoMonto(String(Number(v.saldo_pendiente))); setAbonoFecha(""); setAbonoNotas(""); }}>
                          Cobrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {abonoVentaId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAbonoVentaId(null)}>
            <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>Registrar Cobro</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAbono} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Monto (S/)</Label>
                    <Input type="number" step="0.01" value={abonoMonto} onChange={(e) => setAbonoMonto(e.target.value)} required min="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" value={abonoFecha} onChange={(e) => setAbonoFecha(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Input value={abonoNotas} onChange={(e) => setAbonoNotas(e.target.value)} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setAbonoVentaId(null)}>Cancelar</Button>
                    <Button type="submit">Registrar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
