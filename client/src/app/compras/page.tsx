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
import { DialogModal } from "@/components/ui/dialog-modal";
import { useToast } from "@/components/ui/toast-notification";
import AppLayout from "@/app/layout-wrapper";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Filter,
  Calendar,
  Layers,
  Scale,
  DollarSign,
  Package,
} from "lucide-react";

export default function ComprasPage() {
  const { success, error } = useToast();
  const [calidades, setCalidades] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal & form states
  const [modalCompraOpen, setModalCompraOpen] = useState(false);
  const [calidadId, setCalidadId] = useState("");
  const [cantidadJabas, setCantidadJabas] = useState("");
  const [pesoTotal, setPesoTotal] = useState("");
  const [precioKg, setPrecioKg] = useState("");
  const [notas, setNotas] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtroCalidad, setFiltroCalidad] = useState("");

  const fetchCalidades = useCallback(async () => {
    try {
      const data = await api.getCalidades();
      setCalidades(data);
    } catch {
      error("Error al cargar calidades");
    }
  }, [error]);

  const fetchCompras = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      if (filtroCalidad) params.set("calidad_id", filtroCalidad);
      const data = await api.getCompras(params.toString());
      setCompras(data);
    } catch {
      error("Error al obtener el historial de compras");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, filtroCalidad, error]);

  useEffect(() => {
    fetchCalidades();
    fetchCompras();
  }, [fetchCalidades, fetchCompras]);

  const costoTotalCalculado = Number(pesoTotal) * Number(precioKg) || 0;
  const costoPorJabaCalculado = Number(cantidadJabas) > 0 ? costoTotalCalculado / Number(cantidadJabas) : 0;

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta compra? También se eliminará el registro de limpieza asociado si existe.")) return;
    setDeletingId(id);
    try {
      await api.deleteCompra(id);
      success("Compra eliminada del sistema");
      fetchCompras();
    } catch (err: any) {
      error(err.message || "Error al eliminar la compra");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCompra({
        calidad_id: parseInt(calidadId),
        cantidad_jabas: parseInt(cantidadJabas),
        peso_total_kg: pesoTotal,
        precio_por_kg: precioKg,
        notas,
      });
      setModalCompraOpen(false);
      setCalidadId("");
      setCantidadJabas("");
      setPesoTotal("");
      setPrecioKg("");
      setNotas("");
      success("¡Compra registrada y añadida a inventario!");
      fetchCompras();
    } catch (err: any) {
      error(err.message || "Error al registrar la compra");
    }
  };

  // Metrics
  const totalInvertido = compras.reduce((sum, c) => sum + Number(c.costo_total || 0), 0);
  const totalJabas = compras.reduce((sum, c) => sum + Number(c.cantidad_jabas || 0), 0);
  const totalKg = compras.reduce((sum, c) => sum + Number(c.peso_total_kg || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <ShoppingCart className="w-6 h-6 text-amber-600" />
              Registro de Compras
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingreso de nuevos lotes de huevos por peso y calidad
            </p>
          </div>

          <Button
            onClick={() => setModalCompraOpen(true)}
            className="gap-2 bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Compra</span>
          </Button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Inversión Filtrada</p>
                <p className="text-xl font-extrabold text-amber-700 mt-0.5">{formatCurrency(totalInvertido)}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Jabas</p>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalJabas} jabas</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                <Package className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Peso Total Recibido</p>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalKg.toFixed(1)} kg</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                <Scale className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  aria-label="Fecha inicial"
                  className="bg-transparent text-xs text-slate-700 focus:outline-none"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  aria-label="Fecha final"
                  className="bg-transparent text-xs text-slate-700 focus:outline-none"
                />
              </div>

              <Select
                value={filtroCalidad}
                onChange={(e) => setFiltroCalidad(e.target.value)}
                options={calidades.map((c) => ({ value: String(c.id), label: c.nombre }))}
                placeholder="Todas las Calidades"
                className="h-9 w-44 text-xs"
              />

              <Button size="sm" onClick={fetchCompras} variant="outline" className="h-9">
                <Filter className="w-3.5 h-3.5 mr-1" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compras Table */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Historial de Compras</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {compras.length} {compras.length === 1 ? "registro" : "registros"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote #</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Jabas</TableHead>
                  <TableHead>Peso Total</TableHead>
                  <TableHead>Precio / Kg</TableHead>
                  <TableHead>Costo Total</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-16 text-right pr-4">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-slate-600">No hay compras registradas</p>
                      <p className="text-xs mt-1">Haga clic en &quot;Registrar Compra&quot; para ingresar un nuevo lote.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  compras.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-500">
                        #{c.id}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(c.fecha)}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {c.calidad?.nombre}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {c.cantidad_jabas} jabas
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {Number(c.peso_total_kg).toFixed(2)} kg
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {formatCurrency(Number(c.precio_por_kg))} / kg
                      </TableCell>
                      <TableCell className="font-extrabold text-amber-800">
                        {formatCurrency(Number(c.costo_total))}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                        {c.notas || "-"}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar compra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal: Registrar Compra */}
        <DialogModal
          isOpen={modalCompraOpen}
          onClose={() => setModalCompraOpen(false)}
          title="Registrar Nueva Compra"
          description="Ingrese los datos del proveedor y pesaje para crear el lote"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateCompra} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Calidad Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Calidad de Huevo
                </Label>
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

              {/* Cantidad Jabas */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Cantidad de Jabas
                </Label>
                <Input
                  type="number"
                  value={cantidadJabas}
                  onChange={(e) => setCantidadJabas(e.target.value)}
                  placeholder="Ej. 50"
                  required
                  min="1"
                />
              </div>

              {/* Peso Total */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Peso Total (Kg)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={pesoTotal}
                  onChange={(e) => setPesoTotal(e.target.value)}
                  placeholder="Ej. 1150.5"
                  required
                  min="0"
                />
              </div>

              {/* Precio por Kg */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Precio por Kg (S/)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={precioKg}
                  onChange={(e) => setPrecioKg(e.target.value)}
                  placeholder="Ej. 6.20"
                  required
                  min="0"
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">
                Observaciones / Proveedor
              </Label>
              <Input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Nombre del proveedor, placa del camión o detalles..."
              />
            </div>

            {/* Live Calculation Box */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <div>
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                  Costo Total de Inversión
                </p>
                <p className="text-xs text-amber-700">
                  {pesoTotal || 0} kg &times; S/{Number(precioKg || 0).toFixed(2)}/kg
                  {costoPorJabaCalculado > 0 && (
                    <span className="font-semibold block sm:inline sm:ml-2">
                      (~S/{costoPorJabaCalculado.toFixed(2)} por jaba)
                    </span>
                  )}
                </p>
              </div>
              <p className="text-2xl font-black text-amber-950">
                {formatCurrency(costoTotalCalculado)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalCompraOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600">
                Confirmar y Guardar Compra
              </Button>
            </div>
          </form>
        </DialogModal>
      </div>
    </AppLayout>
  );
}
