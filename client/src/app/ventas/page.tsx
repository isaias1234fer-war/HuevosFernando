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
import { Badge } from "@/components/ui/badge";
import { DialogModal } from "@/components/ui/dialog-modal";
import { useToast } from "@/components/ui/toast-notification";
import AppLayout from "@/app/layout-wrapper";
import {
  Pencil,
  Trash2,
  Plus,
  TrendingUp,
  Search,
  Filter,
  CreditCard,
  Layers,
  Sparkles,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function VentasPage() {
  const { success, error, info } = useToast();
  const [calidades, setCalidades] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [modalVentaOpen, setModalVentaOpen] = useState(false);
  const [calidadId, setCalidadId] = useState("");
  const [cantidadJabas, setCantidadJabas] = useState("");
  const [precioPorJaba, setPrecioPorJaba] = useState("");
  const [notas, setNotas] = useState("");
  const [tipoPago, setTipoPago] = useState("contado");
  const [cliente, setCliente] = useState("");
  const [compraId, setCompraId] = useState("");

  // Filters
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtroCalidad, setFiltroCalidad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [searchCliente, setSearchCliente] = useState("");

  // Modals & Action states
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [abonoVenta, setAbonoVenta] = useState<any | null>(null);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [abonoFecha, setAbonoFecha] = useState("");
  const [abonoNotas, setAbonoNotas] = useState("");

  // Calidad configuration
  const [editCalidadOpen, setEditCalidadOpen] = useState(false);
  const [editPrecio, setEditPrecio] = useState("");
  const [editConsMin, setEditConsMin] = useState("");
  const [editConsMax, setEditConsMax] = useState("");

  const fetchCalidades = useCallback(async () => {
    try {
      const data = await api.getCalidades();
      setCalidades(data);
    } catch (e: any) {
      error("Error al cargar calidades");
    }
  }, [error]);

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      if (filtroCalidad) params.set("calidad_id", filtroCalidad);
      if (filtroEstado) params.set("estado_pago", filtroEstado);
      const data = await api.getVentas(params.toString());
      setVentas(data);
    } catch (e: any) {
      error("Error al obtener ventas");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, filtroCalidad, filtroEstado, error]);

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

  useEffect(() => {
    if (!calidadId) {
      setLotes([]);
      setCompraId("");
      return;
    }
    api
      .getLotes()
      .then((data) => {
        const filtrados = data.filter(
          (l: any) =>
            l.calidad_id === parseInt(calidadId) &&
            l.estado !== "vencido" &&
            l.jabas_restantes > 0
        );
        filtrados.sort(
          (a: any, b: any) =>
            new Date(a.fecha_compra).getTime() - new Date(b.fecha_compra).getTime()
        );
        setLotes(filtrados);
        if (filtrados.length > 0) setCompraId(String(filtrados[0].compra_id));
      })
      .catch(() => {});
  }, [calidadId]);

  const calidadSeleccionada = calidades.find((c) => String(c.id) === calidadId);
  const totalCalculado = Number(cantidadJabas) * Number(precioPorJaba) || 0;

  const handleOpenEditCalidad = () => {
    if (!calidadSeleccionada) return;
    setEditPrecio(String(calidadSeleccionada.precio_venta_jaba));
    setEditConsMin(
      calidadSeleccionada.dias_conservacion_min != null
        ? String(calidadSeleccionada.dias_conservacion_min)
        : ""
    );
    setEditConsMax(
      calidadSeleccionada.dias_conservacion_max != null
        ? String(calidadSeleccionada.dias_conservacion_max)
        : ""
    );
    setEditCalidadOpen(true);
  };

  const handleSaveEditCalidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calidadId) return;
    try {
      await api.updateCalidad(parseInt(calidadId), {
        precio_venta_jaba: editPrecio,
        dias_conservacion_min: editConsMin ? parseInt(editConsMin) : null,
        dias_conservacion_max: editConsMax ? parseInt(editConsMax) : null,
      });
      await fetchCalidades();
      setPrecioPorJaba(editPrecio);
      setEditCalidadOpen(false);
      success("Configuración de calidad actualizada");
    } catch (err: any) {
      error(err.message || "Error al actualizar calidad");
    }
  };

  const handleCreateVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVenta({
        calidad_id: parseInt(calidadId),
        cantidad_jabas: parseInt(cantidadJabas),
        precio_por_jaba: precioPorJaba,
        notas,
        tipo_pago: tipoPago,
        cliente: tipoPago === "fiado" ? cliente : undefined,
        compra_id: compraId || undefined,
      });
      setModalVentaOpen(false);
      setCantidadJabas("");
      setPrecioPorJaba("");
      setNotas("");
      setCliente("");
      setCompraId("");
      success("¡Venta registrada con éxito!");
      fetchVentas();
    } catch (err: any) {
      error(err.message || "Error al registrar la venta");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta venta? El stock será devuelto al inventario.")) return;
    setDeletingId(id);
    try {
      await api.deleteVenta(id);
      success("Venta eliminada y stock restaurado");
      fetchVentas();
    } catch (err: any) {
      error(err.message || "No se pudo eliminar la venta");
    } finally {
      setDeletingId(null);
    }
  };

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
      success("Abono registrado correctamente");
      fetchVentas();
    } catch (err: any) {
      error(err.message || "Error al registrar el abono");
    }
  };

  // Filtered by search client if any
  const ventasFiltradas = ventas.filter((v) => {
    if (!searchCliente) return true;
    return (
      (v.cliente && v.cliente.toLowerCase().includes(searchCliente.toLowerCase())) ||
      (v.notas && v.notas.toLowerCase().includes(searchCliente.toLowerCase()))
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Gestión de Ventas
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro de despachos al contado o fiado con asignación FIFO
            </p>
          </div>

          <Button
            onClick={() => setModalVentaOpen(true)}
            className="gap-2 shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Venta</span>
          </Button>
        </div>

        {/* Filters Toolbar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Buscar por cliente o nota..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Date Filters */}
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

              {/* Quality select */}
              <Select
                value={filtroCalidad}
                onChange={(e) => setFiltroCalidad(e.target.value)}
                options={calidades.map((c) => ({ value: String(c.id), label: c.nombre }))}
                placeholder="Todas las Calidades"
                className="h-9 w-40 text-xs"
              />

              {/* Status select */}
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                options={[
                  { value: "pagado", label: "Pagado" },
                  { value: "parcial", label: "Parcial" },
                  { value: "pendiente", label: "Pendiente" },
                ]}
                placeholder="Todos los Estados"
                className="h-9 w-36 text-xs"
              />

              <Button size="sm" onClick={fetchVentas} variant="outline" className="h-9">
                <Filter className="w-3.5 h-3.5 mr-1" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ventas Table Card */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100">
            <div>
              <CardTitle className="text-base">Historial de Transacciones</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {ventasFiltradas.length} {ventasFiltradas.length === 1 ? "venta encontrada" : "ventas encontradas"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Jabas</TableHead>
                  <TableHead>Precio/jaba</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tipo Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Saldo Pendiente</TableHead>
                  <TableHead>Lote FIFO</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-24 text-right pr-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12 text-slate-400">
                      <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-slate-600">No se encontraron ventas</p>
                      <p className="text-xs mt-1">Intente ajustar los filtros o registre una nueva venta.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  ventasFiltradas.map((v) => (
                    <TableRow key={v.id} className="group">
                      <TableCell className="font-medium text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(v.fecha)}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {v.calidad?.nombre}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {v.cantidad_jabas}
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">
                        {formatCurrency(Number(v.precio_por_jaba))}
                      </TableCell>
                      <TableCell className="font-extrabold text-slate-900">
                        {formatCurrency(Number(v.total))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={v.tipo_pago === "fiado" ? "warning" : "success"}
                          dot
                        >
                          {v.tipo_pago === "fiado" ? "Fiado" : "Contado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            v.estado_pago === "pagado"
                              ? "success"
                              : v.estado_pago === "parcial"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {v.estado_pago}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs text-slate-800">
                        {v.cliente ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {v.cliente}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.tipo_pago === "fiado" && Number(v.saldo_pendiente) > 0 ? (
                          <span className="font-bold text-rose-600">
                            {formatCurrency(Number(v.saldo_pendiente))}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {v.compra_id ? `#${v.compra_id}` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                        {v.notas || "-"}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {v.tipo_pago === "fiado" && Number(v.saldo_pendiente) > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAbonoVenta(v);
                                setAbonoMonto(String(Number(v.saldo_pendiente)));
                                setAbonoFecha("");
                                setAbonoNotas("");
                              }}
                              className="h-8 px-2 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              title="Registrar Cobro / Abono"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              <span className="text-[11px]">Cobrar</span>
                            </Button>
                          )}
                          <button
                            onClick={() => handleDelete(v.id)}
                            disabled={deletingId === v.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar venta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal: Nueva Venta */}
        <DialogModal
          isOpen={modalVentaOpen}
          onClose={() => setModalVentaOpen(false)}
          title="Registrar Nueva Venta"
          description="Complete los datos para generar el despacho y actualizar inventario"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateVenta} className="space-y-4">
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
                    label: `${c.nombre} (S/ ${c.precio_venta_jaba}/jaba)`,
                  }))}
                  placeholder="Seleccionar calidad"
                  required
                />
              </div>

              {/* Lote FIFO */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Lote Sugerido (FIFO)
                </Label>
                <Select
                  value={compraId}
                  onChange={(e) => setCompraId(e.target.value)}
                  options={lotes.map((l: any) => ({
                    value: String(l.compra_id),
                    label: `#${l.compra_id} - ${l.jabas_restantes} disp. (${new Date(
                      l.fecha_compra
                    ).toLocaleDateString()})`,
                  }))}
                  placeholder={lotes.length > 0 ? "Seleccionar lote" : "Sin lotes disponibles"}
                />
              </div>

              {/* Cantidad Jabas */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Cantidad (Jabas)
                </Label>
                <Input
                  type="number"
                  value={cantidadJabas}
                  onChange={(e) => setCantidadJabas(e.target.value)}
                  placeholder="Ej. 10"
                  required
                  min="1"
                />
              </div>

              {/* Precio por jaba */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-slate-600">
                    Precio por Jaba (S/)
                  </Label>
                  {calidadId && (
                    <button
                      type="button"
                      onClick={handleOpenEditCalidad}
                      className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Pencil className="w-3 h-3" /> Configurar
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={precioPorJaba}
                  onChange={(e) => setPrecioPorJaba(e.target.value)}
                  placeholder="0.00"
                  required
                  min="0"
                />
              </div>

              {/* Tipo de Pago */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Condición de Pago
                </Label>
                <Select
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value)}
                  options={[
                    { value: "contado", label: "Al Contado (Efectivo / Inmediato)" },
                    { value: "fiado", label: "Al Fiado (Cuenta por Cobrar)" },
                  ]}
                />
              </div>

              {/* Cliente name if Fiado */}
              {tipoPago === "fiado" && (
                <div className="space-y-1.5 animate-fade-in">
                  <Label className="text-xs font-bold uppercase text-slate-600">
                    Nombre del Cliente / Deudor
                  </Label>
                  <Input
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Nombre completo o negocio"
                    required={tipoPago === "fiado"}
                  />
                </div>
              )}
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">
                Observaciones / Notas
              </Label>
              <Input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Detalles adicionales de la entrega..."
              />
            </div>

            {/* Total Summary Card */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between mt-4">
              <div>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  Monto Total a Cobrar
                </p>
                <p className="text-xs text-emerald-600">
                  {cantidadJabas || 0} jabas &times; S/{Number(precioPorJaba || 0).toFixed(2)}
                </p>
              </div>
              <p className="text-2xl font-black text-emerald-900">
                {formatCurrency(totalCalculado)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalVentaOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="shadow-md">
                Confirmar y Registrar Venta
              </Button>
            </div>
          </form>
        </DialogModal>

        {/* Modal: Registrar Abono */}
        {abonoVenta && (
          <DialogModal
            isOpen={!!abonoVenta}
            onClose={() => setAbonoVenta(null)}
            title="Registrar Cobro / Abono"
            description={`Cliente: ${abonoVenta.cliente || "Sin nombre"} • Deuda total: ${formatCurrency(
              Number(abonoVenta.saldo_pendiente)
            )}`}
          >
            <form onSubmit={handleAbono} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Monto a Abonar (S/)
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
                  Fecha del Pago
                </Label>
                <Input
                  type="date"
                  value={abonoFecha}
                  onChange={(e) => setAbonoFecha(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Comentarios / Método (Yape, Plin, Efectivo)
                </Label>
                <Input
                  value={abonoNotas}
                  onChange={(e) => setAbonoNotas(e.target.value)}
                  placeholder="Ej. Transferencia BCP"
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
                <Button type="submit">Registrar Cobro</Button>
              </div>
            </form>
          </DialogModal>
        )}

        {/* Modal: Editar Calidad */}
        {editCalidadOpen && (
          <DialogModal
            isOpen={editCalidadOpen}
            onClose={() => setEditCalidadOpen(false)}
            title={`Configuración: ${calidadSeleccionada?.nombre}`}
            description="Ajuste el precio de venta predeterminado y el tiempo de conservación"
          >
            <form onSubmit={handleSaveEditCalidad} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">
                  Precio Venta por Jaba (S/)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editPrecio}
                  onChange={(e) => setEditPrecio(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600">
                    Días Conservación Mín.
                  </Label>
                  <Input
                    type="number"
                    value={editConsMin}
                    onChange={(e) => setEditConsMin(e.target.value)}
                    placeholder="Ej. 15"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600">
                    Días Conservación Máx.
                  </Label>
                  <Input
                    type="number"
                    value={editConsMax}
                    onChange={(e) => setEditConsMax(e.target.value)}
                    placeholder="Ej. 21"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditCalidadOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </DialogModal>
        )}
      </div>
    </AppLayout>
  );
}
