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
import { DialogModal } from "@/components/ui/dialog-modal";
import { useToast } from "@/components/ui/toast-notification";
import AppLayout from "@/app/layout-wrapper";
import {
  Sparkles,
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  Package,
  Layers,
  Egg,
  CheckCircle2,
} from "lucide-react";

export default function LimpiezaPage() {
  const { success, error } = useToast();
  const [comprasLimpieza, setComprasLimpieza] = useState<any[]>([]);
  const [limpiezas, setLimpiezas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form & modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [compraId, setCompraId] = useState("");
  const [huevosRotos, setHuevosRotos] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Filters
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
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
    } catch {
      error("Error al cargar registros de limpieza");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLimpieza({
        compra_id: parseInt(compraId),
        huevos_rotos: parseInt(huevosRotos),
        observaciones,
      });
      setModalOpen(false);
      setCompraId("");
      setHuevosRotos("");
      setObservaciones("");
      success("Registro de limpieza guardado con éxito");
      fetchData();
    } catch (err: any) {
      error(err.message || "Error al registrar la limpieza");
    }
  };

  const totalHuevosRotos = limpiezas.reduce((s, l) => s + (l.huevos_rotos || 0), 0);
  const totalJabasRotas = limpiezas.reduce((s, l) => s + Number(l.jabas_rotas_equivalente || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-teal-600" />
              Limpieza & Control de Merma
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspección de calidad para lotes clasificados con merma por rotura
            </p>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="gap-2 bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Limpieza</span>
          </Button>
        </div>

        {/* Quick Merma Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-rose-100 bg-gradient-to-br from-white to-rose-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Huevos Rotos Registrados
                </p>
                <p className="text-2xl font-black text-rose-700 mt-0.5">
                  {totalHuevosRotos.toLocaleString()} unidades
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Equivalente en Jabas Perdidas
                </p>
                <p className="text-2xl font-black text-amber-700 mt-0.5">
                  {totalJabasRotas.toFixed(2)} jabas
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                <Package className="w-6 h-6" />
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

              <Button size="sm" onClick={fetchData} variant="outline" className="h-9">
                <Filter className="w-3.5 h-3.5 mr-1" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Limpiezas Table */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base">Historial de Inspección y Merma</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {limpiezas.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-teal-500 opacity-60" />
                <p className="font-bold text-slate-700 text-base">Sin registros de merma pendientes</p>
                <p className="text-xs text-slate-500 mt-1">No hay limpiezas reportadas en el rango de fechas seleccionado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Compra / Lote #</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Huevos Rotos</TableHead>
                    <TableHead>Jabas Equiv.</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {limpiezas.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(l.fecha)}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-500">
                        #{l.compra_id}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {l.compra?.calidad?.nombre}
                      </TableCell>
                      <TableCell className="font-bold text-rose-600">
                        {l.huevos_rotos} uds.
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {Number(l.jabas_rotas_equivalente).toFixed(2)} jabas
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                        {l.observaciones || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal: Registrar Limpieza */}
        <DialogModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Registrar Limpieza de Lote"
          description="Seleccione una compra con calidad 'Manchado' o que requiera merma"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">
                Lote de Compra
              </Label>
              <Select
                value={compraId}
                onChange={(e) => setCompraId(e.target.value)}
                options={comprasLimpieza.map((c: any) => ({
                  value: String(c.id),
                  label: `#${c.id} - ${c.calidad.nombre} (${c.cantidad_jabas} jabas)`,
                }))}
                placeholder={comprasLimpieza.length > 0 ? "Seleccionar compra" : "No hay compras pendientes"}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">
                Huevos Rotos (Unidades)
              </Label>
              <Input
                type="number"
                value={huevosRotos}
                onChange={(e) => setHuevosRotos(e.target.value)}
                placeholder="Ej. 18"
                required
                min="1"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">
                Observaciones
              </Label>
              <Input
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Causa de rotura, estado del lote..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                Guardar Inspección
              </Button>
            </div>
          </form>
        </DialogModal>
      </div>
    </AppLayout>
  );
}
