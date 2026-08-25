"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DialogModal } from "@/components/ui/dialog-modal";
import { useToast } from "@/components/ui/toast-notification";
import AppLayout from "@/app/layout-wrapper";
import {
  CreditCard,
  Search,
  CheckCircle2,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  TrendingDown,
} from "lucide-react";

export default function CuentasCobrarPage() {
  const { success, error } = useToast();
  const [ventas, setVentas] = useState<any[]>([]);
  const [searchCliente, setSearchCliente] = useState("");
  const [loading, setLoading] = useState(true);

  // Abono Modal states
  const [abonoVenta, setAbonoVenta] = useState<any | null>(null);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [abonoFecha, setAbonoFecha] = useState("");
  const [abonoNotas, setAbonoNotas] = useState("");

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getVentas();
      const fiados = data.filter(
        (v: any) => v.tipo_pago === "fiado" && Number(v.saldo_pendiente) > 0
      );
      fiados.sort(
        (a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
      setVentas(fiados);
    } catch {
      error("Error al obtener cuentas por cobrar");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  const handleAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonoVenta) return;
    try {
      await api.createPago({
        venta_id: abonoVenta.id,
        monto: abonoMonto,
        fecha: abonoFecha || undefined,
        notas: abonoNotas || undefined,
      });
      setAbonoVenta(null);
      setAbonoMonto("");
      setAbonoFecha("");
      setAbonoNotas("");
      success("Cobro registrado con éxito");
      fetchVentas();
    } catch (err: any) {
      error(err.message || "Error al procesar el pago");
    }
  };

  const totalPorCobrar = ventas.reduce(
    (sum: number, v: any) => sum + Number(v.saldo_pendiente || 0),
    0
  );

  const ventasFiltradas = ventas.filter((v) => {
    if (!searchCliente) return true;
    return (
      (v.cliente && v.cliente.toLowerCase().includes(searchCliente.toLowerCase())) ||
      (v.calidad?.nombre && v.calidad.nombre.toLowerCase().includes(searchCliente.toLowerCase()))
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-orange-600" />
              Cuentas por Cobrar (Fiados)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro y control de saldos pendientes por cliente
            </p>
          </div>

          <div className="flex items-center gap-3 bg-orange-50 border border-orange-200/80 px-4 py-2 rounded-2xl">
            <div className="p-2 rounded-xl bg-orange-500 text-white shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-orange-800 tracking-wider">
                Total Deuda Acumulada
              </p>
              <p className="text-xl font-black text-orange-950">
                {formatCurrency(totalPorCobrar)}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Buscar por nombre de cliente o calidad..."
                value={searchCliente}
                onChange={(e) => setSearchCliente(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Cartera de Clientes Deudores</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {ventasFiltradas.length} {ventasFiltradas.length === 1 ? "cuenta pendiente" : "cuentas pendientes"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ventasFiltradas.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
                <p className="font-bold text-slate-700 text-base">¡Todas las cuentas están al día!</p>
                <p className="text-xs text-slate-500 mt-1">No hay saldos pendientes por cobrar en este momento.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Venta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Jabas</TableHead>
                    <TableHead>Monto Total</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-28 text-right pr-4">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventasFiltradas.map((v) => (
                    <TableRow key={v.id} className="group">
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(v.fecha)}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 flex items-center gap-1.5 pt-4">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{v.cliente || "Cliente sin nombre"}</span>
                      </TableCell>
                      <TableCell className="text-slate-800 font-medium">
                        {v.calidad?.nombre}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        {v.cantidad_jabas} jabas
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatCurrency(Number(v.total))}
                      </TableCell>
                      <TableCell className="font-extrabold text-rose-600 text-sm">
                        {formatCurrency(Number(v.saldo_pendiente))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={v.estado_pago === "parcial" ? "warning" : "danger"}
                          dot
                        >
                          {v.estado_pago === "parcial" ? "Parcial" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setAbonoVenta(v);
                            setAbonoMonto(String(Number(v.saldo_pendiente)));
                            setAbonoFecha("");
                            setAbonoNotas("");
                          }}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
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

        {/* Modal: Registrar Cobro */}
        {abonoVenta && (
          <DialogModal
            isOpen={!!abonoVenta}
            onClose={() => setAbonoVenta(null)}
            title="Registrar Cobro a Cliente"
            description={`Cliente: ${abonoVenta.cliente || "Sin nombre"} • Saldo actual: ${formatCurrency(
              Number(abonoVenta.saldo_pendiente)
            )}`}
          >
            <form onSubmit={handleAbono} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Monto a Cobrar (S/)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={abonoMonto}
                  onChange={(e) => setAbonoMonto(e.target.value)}
                  placeholder="0.00"
                  required
                  min="0.01"
                  max={Number(abonoVenta.saldo_pendiente)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Fecha del Cobro
                </Label>
                <Input
                  type="date"
                  value={abonoFecha}
                  onChange={(e) => setAbonoFecha(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Método / Observaciones
                </Label>
                <Input
                  value={abonoNotas}
                  onChange={(e) => setAbonoNotas(e.target.value)}
                  placeholder="Ej. Yape, Efectivo en caja..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAbonoVenta(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Confirmar Cobro</Button>
              </div>
            </form>
          </DialogModal>
        )}
      </div>
    </AppLayout>
  );
}
