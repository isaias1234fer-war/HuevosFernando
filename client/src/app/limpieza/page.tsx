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
  Egg,
  CheckCircle2,
  Trash2,
  ClipboardList,
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
  const [fechaLimpieza, setFechaLimpieza] = useState("");

  // Filters
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtroCompra, setFiltroCompra] = useState("");

  // Delete confirm
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Constants
  const HUEVOS_POR_JABA = 360;
  const HUEVOS_POR_PAQUETE = 180;
  const HUEVOS_POR_CELDA = 30;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const calidades = await api.getCalidades();
      const limpiezaCalidades = calidades.filter((c: any) => c.requiere_limpieza);
      const ids = limpiezaCalidades.map((c: any) => c.id);

      if (ids.length > 0) {
        // Fetch all manchado/limpieza compras (not just those without limpieza)
        const params = ids.map((id: number) => `calidad_id=${id}`).join("&");
        const compras = await api.getCompras(params);
        setComprasLimpieza(compras);
      }

      const limpiezaParams = new URLSearchParams();
      if (desde) limpiezaParams.set("desde", desde);
      if (hasta) limpiezaParams.set("hasta", hasta);
      if (filtroCompra) limpiezaParams.set("compra_id", filtroCompra);
      const limpiezasData = await api.getLimpiezas(limpiezaParams.toString());
      setLimpiezas(limpiezasData);
    } catch {
      error("Error al cargar registros de limpieza");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, filtroCompra, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLimpieza({
        compra_id: parseInt(compraId),
        huevos_rotos: parseInt(huevosRotos),
        fecha: fechaLimpieza || undefined,
        observaciones,
      });
      setModalOpen(false);
      setCompraId("");
      setHuevosRotos("");
      setObservaciones("");
      setFechaLimpieza("");
      success("Merma de limpieza registrada con éxito");
      fetchData();
    } catch (err: any) {
      error(err.message || "Error al registrar la limpieza");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este registro de merma? El stock del lote será restaurado.")) return;
    setDeletingId(id);
    try {
      await api.deleteLimpieza(id);
      success("Registro de merma eliminado");
      fetchData();
    } catch (err: any) {
      error(err.message || "Error al eliminar registro");
    } finally {
      setDeletingId(null);
    }
  };

  const totalHuevosRotos = limpiezas.reduce((s, l) => s + (l.huevos_rotos || 0), 0);
  const totalJabasRotas = limpiezas.reduce((s, l) => s + Number(l.jabas_rotas_equivalente || 0), 0);

  // Computed: Mermas por compra
  const mermasPorCompra: Record<number, { total_huevos: number; total_jabas: number; registros: number }> = {};
  for (const l of limpiezas) {
    if (!mermasPorCompra[l.compra_id]) {
      mermasPorCompra[l.compra_id] = { total_huevos: 0, total_jabas: 0, registros: 0 };
    }
    mermasPorCompra[l.compra_id].total_huevos += l.huevos_rotos;
    mermasPorCompra[l.compra_id].total_jabas += Number(l.jabas_rotas_equivalente);
    mermasPorCompra[l.compra_id].registros += 1;
  }

  // Preview calculation
  const huevosRotosNum = parseInt(huevosRotos) || 0;
  const jabasEquivalente = huevosRotosNum / HUEVOS_POR_JABA;
  const celdasEquivalente = huevosRotosNum / HUEVOS_POR_CELDA;
  const paquetesEquivalente = huevosRotosNum / HUEVOS_POR_PAQUETE;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-teal-600" />
              Limpieza &amp; Control de Merma
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Registra los huevos rotos durante la limpieza de lotes manchados — múltiples jornadas por lote
            </p>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="gap-2 bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Merma</span>
          </Button>
        </div>

        {/* Equivalencias Card */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1 Celda</p>
            <p className="text-lg font-black text-slate-700 mt-0.5">30 huevos</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1 Paquete</p>
            <p className="text-lg font-black text-slate-700 mt-0.5">180 huevos</p>
          </div>
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-500">1 Jaba</p>
            <p className="text-lg font-black text-teal-700 mt-0.5">360 huevos</p>
          </div>
        </div>

        {/* Quick Merma Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-rose-100 bg-gradient-to-br from-white to-rose-50/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Huevos Rotos
                </p>
                <p className="text-2xl font-black text-rose-700 mt-0.5">
                  {totalHuevosRotos.toLocaleString()} uds.
                </p>
                <p className="text-xs text-rose-400 mt-1">
                  ≈ {(totalHuevosRotos / HUEVOS_POR_CELDA).toFixed(1)} celdas · {(totalHuevosRotos / HUEVOS_POR_PAQUETE).toFixed(1)} paquetes
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
                  {totalJabasRotas.toFixed(3)} jabas
                </p>
                <p className="text-xs text-amber-400 mt-1">
                  {limpiezas.length} registros de merma en período
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

              <div className="flex items-center gap-1.5">
                <select
                  value={filtroCompra}
                  onChange={(e) => setFiltroCompra(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-teal-400"
                >
                  <option value="">Todos los lotes</option>
                  {comprasLimpieza.map((c: any) => (
                    <option key={c.id} value={String(c.id)}>
                      #{c.id} - {c.calidad?.nombre} ({c.cantidad_jabas} jabas)
                    </option>
                  ))}
                </select>
              </div>

              <Button size="sm" onClick={fetchData} variant="outline" className="h-9">
                <Filter className="w-3.5 h-3.5 mr-1" />
                Filtrar
              </Button>

              {(desde || hasta || filtroCompra) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-slate-400"
                  onClick={() => { setDesde(""); setHasta(""); setFiltroCompra(""); }}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Limpiezas Table */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-teal-600" />
              Historial de Merma por Jornada
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16 text-slate-400">Cargando...</div>
            ) : limpiezas.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-teal-500 opacity-60" />
                <p className="font-bold text-slate-700 text-base">Sin registros de merma</p>
                <p className="text-xs text-slate-500 mt-1">No hay limpiezas reportadas en el período seleccionado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Jornada</TableHead>
                    <TableHead>Lote #</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Huevos Rotos</TableHead>
                    <TableHead>Equiv. Celdas</TableHead>
                    <TableHead>Equiv. Jabas</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-right pr-4">Acc.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {limpiezas.map((l) => (
                    <TableRow key={l.id} className="group">
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
                      <TableCell className="text-slate-700 text-sm font-semibold">
                        {(l.huevos_rotos / HUEVOS_POR_CELDA).toFixed(1)} celdas
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {Number(l.jabas_rotas_equivalente).toFixed(4)} jabas
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                        {l.observaciones || "—"}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <button
                          onClick={() => handleDelete(l.id)}
                          disabled={deletingId === l.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar registro de merma"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal: Registrar Merma de Limpieza */}
        <DialogModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Registrar Merma de Limpieza"
          description="Puedes agregar múltiples jornadas de limpieza para el mismo lote manchado"
          maxWidth="lg"
          onSubmit={handleSubmit}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto min-h-[44px] h-11 text-sm font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto min-h-[44px] h-11 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                Guardar Jornada
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Lote selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">
                Lote de Compra (Manchados)
              </Label>
              <Select
                value={compraId}
                onChange={(e) => setCompraId(e.target.value)}
                options={comprasLimpieza.map((c: any) => ({
                  value: String(c.id),
                  label: `#${c.id} — ${c.calidad?.nombre} · ${c.cantidad_jabas} jabas · ${new Date(c.fecha).toLocaleDateString()}`,
                }))}
                placeholder={comprasLimpieza.length > 0 ? "Seleccionar lote manchado" : "No hay compras de manchados"}
                required
              />
              {compraId && mermasPorCompra[parseInt(compraId)] && (
                <p className="text-xs text-amber-600 font-medium">
                  ⚠ Este lote ya tiene {mermasPorCompra[parseInt(compraId)].registros} registro(s) de merma totalizando {mermasPorCompra[parseInt(compraId)].total_huevos} huevos rotos
                </p>
              )}
            </div>

            {/* Fecha jornada */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">
                Fecha de esta Jornada
              </Label>
              <Input
                type="date"
                value={fechaLimpieza}
                onChange={(e) => setFechaLimpieza(e.target.value)}
                placeholder="Hoy por defecto"
              />
            </div>

            {/* Huevos rotos */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">
                Huevos Rotos esta Jornada
              </Label>
              <Input
                type="number"
                value={huevosRotos}
                onChange={(e) => setHuevosRotos(e.target.value)}
                placeholder="Ej. 18"
                required
                min="1"
              />
              {huevosRotosNum > 0 && (
                <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 mt-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Equivalencia</p>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                    <div>
                      <p className="text-xs text-slate-400">Celdas</p>
                      <p className="font-black text-slate-700 text-sm">{celdasEquivalente.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Paquetes</p>
                      <p className="font-black text-slate-700 text-sm">{paquetesEquivalente.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-teal-500">Jabas</p>
                      <p className="font-black text-teal-700 text-sm">{jabasEquivalente.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">
                Observaciones
              </Label>
              <Input
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Causa de rotura, estado del lote, día de limpieza..."
              />
            </div>
          </div>
        </DialogModal>
      </div>
    </AppLayout>
  );
}
