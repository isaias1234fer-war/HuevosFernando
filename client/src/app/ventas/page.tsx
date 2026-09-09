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
  ShoppingCart,
  DollarSign,
  User,
  Calendar,
  X,
  PackagePlus,
} from "lucide-react";

// ----- Constants -----
const UNIT_TO_JABAS: Record<string, number> = {
  jabas: 1,
  paquetes: 0.5,
  celdas: 1 / 12,
  unidades: 1 / 360,
};
const UNIT_OPTIONS = [
  { value: "jabas",    label: "Jabas (360 huevos)" },
  { value: "paquetes", label: "Paquetes (180 huevos)" },
  { value: "celdas",   label: "Celdas (30 huevos)" },
  { value: "unidades", label: "Unidades sueltas" },
];

function toJabas(cantidad: number, unidad: string) {
  return cantidad * (UNIT_TO_JABAS[unidad] ?? 1);
}

// ----- Types -----
interface CartItem {
  id: string; // temp local ID
  calidad_id: string;
  calidad_nombre: string;
  compra_id: string;
  unidad_medida: string;
  cantidad_unidades: string;
  precio_por_jaba: string;
}

export default function VentasPage() {
  const { success, error, info } = useToast();
  const [calidades, setCalidades] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [todosLotes, setTodosLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ---- Modal state ----
  const [modalVentaOpen, setModalVentaOpen] = useState(false);

  // ---- Cart (multi-producto) ----
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tipoPago, setTipoPago] = useState("contado");
  const [cliente, setCliente] = useState("");
  const [notasVenta, setNotasVenta] = useState("");
  const [fechaVenta, setFechaVenta] = useState("");

  // ---- Item being edited before adding to cart ----
  const [itemCalidadId, setItemCalidadId] = useState("");
  const [itemUnidad, setItemUnidad] = useState("jabas");
  const [itemCantidad, setItemCantidad] = useState("");
  const [itemPrecio, setItemPrecio] = useState("");
  const [itemCompraId, setItemCompraId] = useState("");
  const [itemLotes, setItemLotes] = useState<any[]>([]);

  // ---- Filters ----
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtroCalidad, setFiltroCalidad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [searchCliente, setSearchCliente] = useState("");

  // ---- Modals ----
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [abonoVenta, setAbonoVenta] = useState<any | null>(null);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [abonoFecha, setAbonoFecha] = useState("");
  const [abonoNotas, setAbonoNotas] = useState("");

  // ---- Edit calidad ----
  const [editCalidadOpen, setEditCalidadOpen] = useState(false);
  const [editingCalidadId, setEditingCalidadId] = useState<number | null>(null);
  const [editPrecio, setEditPrecio] = useState("");
  const [editConsMin, setEditConsMin] = useState("");
  const [editConsMax, setEditConsMax] = useState("");

  // ---- Data fetching ----
  const fetchCalidades = useCallback(async () => {
    try {
      const data = await api.getCalidades();
      setCalidades(data);
    } catch {
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
    } catch {
      error("Error al obtener ventas");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta, filtroCalidad, filtroEstado, error]);

  const fetchLotes = useCallback(async () => {
    try {
      const data = await api.getLotes();
      setTodosLotes(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchCalidades();
    fetchVentas();
    fetchLotes();
  }, [fetchCalidades, fetchVentas, fetchLotes]);

  // ---- When calidad changes in the item editor ----
  useEffect(() => {
    if (!itemCalidadId) {
      setItemLotes([]);
      setItemCompraId("");
      setItemPrecio("");
      return;
    }
    const cal = calidades.find((c) => String(c.id) === itemCalidadId);
    if (cal) setItemPrecio(String(cal.precio_venta_jaba));

    const lotesCalidad = todosLotes.filter(
      (l: any) =>
        l.calidad_id === parseInt(itemCalidadId) &&
        l.estado !== "vencido" &&
        l.jabas_restantes > 0
    );
    lotesCalidad.sort(
      (a: any, b: any) =>
        new Date(a.fecha_compra).getTime() - new Date(b.fecha_compra).getTime()
    );
    setItemLotes(lotesCalidad);
    setItemCompraId(lotesCalidad.length > 0 ? String(lotesCalidad[0].compra_id) : "");
  }, [itemCalidadId, calidades, todosLotes]);

  // ---- Cart helpers ----
  const itemJabas = toJabas(Number(itemCantidad) || 0, itemUnidad);
  const itemSubtotal = itemJabas * (Number(itemPrecio) || 0);

  const cartTotals = cart.reduce(
    (acc, item) => {
      const jabas = toJabas(Number(item.cantidad_unidades), item.unidad_medida);
      const sub = jabas * Number(item.precio_por_jaba);
      return { jabas: acc.jabas + jabas, subtotal: acc.subtotal + sub };
    },
    { jabas: 0, subtotal: 0 }
  );

  const addToCart = () => {
    if (!itemCalidadId || !itemCantidad || !itemPrecio) {
      info("Completa todos los campos del producto antes de agregar");
      return;
    }
    const cal = calidades.find((c) => String(c.id) === itemCalidadId);
    setCart((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        calidad_id: itemCalidadId,
        calidad_nombre: cal?.nombre ?? "",
        compra_id: itemCompraId,
        unidad_medida: itemUnidad,
        cantidad_unidades: itemCantidad,
        precio_por_jaba: itemPrecio,
      },
    ]);
    // Reset item form for next product
    setItemCalidadId("");
    setItemUnidad("jabas");
    setItemCantidad("");
    setItemPrecio("");
    setItemCompraId("");
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((it) => it.id !== id));
  };

  const resetModal = () => {
    setCart([]);
    setTipoPago("contado");
    setCliente("");
    setNotasVenta("");
    setFechaVenta("");
    setItemCalidadId("");
    setItemUnidad("jabas");
    setItemCantidad("");
    setItemPrecio("");
    setItemCompraId("");
  };

  // ---- Submit sale ----
  const handleCreateVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      error("Agrega al menos un producto al carrito");
      return;
    }
    try {
      await api.createVentaLote({
        fecha: fechaVenta || undefined,
        cliente: cliente || undefined,
        tipo_pago: tipoPago,
        notas: notasVenta || undefined,
        items: cart.map((item) => ({
          calidad_id: parseInt(item.calidad_id),
          unidad_medida: item.unidad_medida,
          cantidad_unidades: Number(item.cantidad_unidades),
          precio_por_jaba: Number(item.precio_por_jaba),
          compra_id: item.compra_id ? parseInt(item.compra_id) : undefined,
        })),
      });
      resetModal();
      setModalVentaOpen(false);
      success(`¡Venta registrada! ${cart.length} producto(s) — ${formatCurrency(cartTotals.subtotal)}`);
      fetchVentas();
      fetchLotes();
    } catch (err: any) {
      error(err.message || "Error al registrar la venta");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta línea de venta? El stock será restaurado.")) return;
    setDeletingId(id);
    try {
      await api.deleteVenta(id);
      success("Venta eliminada y stock restaurado");
      fetchVentas();
      fetchLotes();
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

  const handleOpenEditCalidad = (calId: number) => {
    const cal = calidades.find((c) => c.id === calId);
    if (!cal) return;
    setEditingCalidadId(calId);
    setEditPrecio(String(cal.precio_venta_jaba));
    setEditConsMin(cal.dias_conservacion_min != null ? String(cal.dias_conservacion_min) : "");
    setEditConsMax(cal.dias_conservacion_max != null ? String(cal.dias_conservacion_max) : "");
    setEditCalidadOpen(true);
  };

  const handleSaveEditCalidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCalidadId) return;
    try {
      await api.updateCalidad(editingCalidadId, {
        precio_venta_jaba: editPrecio,
        dias_conservacion_min: editConsMin ? parseInt(editConsMin) : null,
        dias_conservacion_max: editConsMax ? parseInt(editConsMax) : null,
      });
      await fetchCalidades();
      setEditCalidadOpen(false);
      success("Configuración de calidad actualizada");
    } catch (err: any) {
      error(err.message || "Error al actualizar calidad");
    }
  };

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              Gestión de Ventas
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Registra pedidos con múltiples calidades — Primera, Manchados, o mezcla
            </p>
          </div>
          <Button
            onClick={() => { resetModal(); setModalVentaOpen(true); }}
            className="gap-2 shadow-md shadow-emerald-600/20"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Nueva Venta</span>
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="bg-transparent text-xs focus:outline-none" />
                <span className="text-slate-300">-</span>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="bg-transparent text-xs focus:outline-none" />
              </div>
              <select value={filtroCalidad} onChange={(e) => setFiltroCalidad(e.target.value)} className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none">
                <option value="">Todas las calidades</option>
                {calidades.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
              </select>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none">
                <option value="">Todo estado</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="parcial">Parcial</option>
              </select>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs flex-1 min-w-[150px]">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input placeholder="Buscar cliente..." value={searchCliente} onChange={(e) => setSearchCliente(e.target.value)} className="bg-transparent text-xs focus:outline-none flex-1" />
              </div>
              <Button size="sm" onClick={fetchVentas} variant="outline" className="h-9">
                <Filter className="w-3.5 h-3.5 mr-1" /> Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Ventas */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base">Historial de Ventas</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio/Jaba</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right pr-4">Acc.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12 text-slate-400">
                      <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-slate-600">No se encontraron ventas</p>
                      <p className="text-xs mt-1">Ajuste los filtros o registre una nueva venta.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  ventasFiltradas.map((v) => (
                    <TableRow key={v.id} className="group">
                      <TableCell className="font-medium text-xs text-slate-600 whitespace-nowrap">{formatDate(v.fecha)}</TableCell>
                      <TableCell className="font-bold text-slate-900">{v.calidad?.nombre}</TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {v.unidad_medida && v.unidad_medida !== "jabas"
                          ? `${Number(v.cantidad_unidades)} ${v.unidad_medida}`
                          : `${Number(v.cantidad_jabas).toFixed(2)} jabas`}
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">{formatCurrency(Number(v.precio_por_jaba))}</TableCell>
                      <TableCell className="font-extrabold text-slate-900">{formatCurrency(Number(v.total))}</TableCell>
                      <TableCell>
                        <Badge variant={v.tipo_pago === "fiado" ? "warning" : "success"} dot>
                          {v.tipo_pago === "fiado" ? "Fiado" : "Contado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.estado_pago === "pagado" ? "success" : v.estado_pago === "parcial" ? "warning" : "danger"}>
                          {v.estado_pago}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-xs text-slate-800">
                        {v.cliente ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />{v.cliente}
                          </span>
                        ) : <span className="text-slate-400">-</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {v.tipo_pago === "fiado" && Number(v.saldo_pendiente) > 0 ? (
                          <span className="font-bold text-rose-600">{formatCurrency(Number(v.saldo_pendiente))}</span>
                        ) : <span className="text-slate-400">-</span>}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">{v.compra_id ? `#${v.compra_id}` : "-"}</TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-xs truncate">{v.notas || "-"}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {v.tipo_pago === "fiado" && Number(v.saldo_pendiente) > 0 && (
                            <Button
                              variant="outline" size="sm"
                              onClick={() => { setAbonoVenta(v); setAbonoMonto(String(Number(v.saldo_pendiente))); setAbonoFecha(""); setAbonoNotas(""); }}
                              className="h-8 px-2 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              <span className="text-[11px]">Cobrar</span>
                            </Button>
                          )}
                          <button
                            onClick={() => handleDelete(v.id)}
                            disabled={deletingId === v.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
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

        {/* ========== MODAL: Nueva Venta con Carrito ========== */}
        <DialogModal
          isOpen={modalVentaOpen}
          onClose={() => { resetModal(); setModalVentaOpen(false); }}
          title="Nueva Venta"
          description="Agrega uno o varios productos al pedido, luego confirma"
          maxWidth="xl"
        >
          <form onSubmit={handleCreateVenta} className="space-y-5">

            {/* --- Datos globales del pedido --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">Condición de Pago</Label>
                <Select
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value)}
                  options={[
                    { value: "contado", label: "Al Contado" },
                    { value: "fiado",   label: "Al Fiado (Cuenta por Cobrar)" },
                  ]}
                />
              </div>
              {tipoPago === "fiado" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600">Nombre del Cliente</Label>
                  <Input
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Nombre o negocio"
                    required={tipoPago === "fiado"}
                  />
                </div>
              )}
              {tipoPago === "contado" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600">Cliente (opcional)</Label>
                  <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del comprador" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">Fecha (opcional)</Label>
                <Input type="date" value={fechaVenta} onChange={(e) => setFechaVenta(e.target.value)} />
              </div>
            </div>

            {/* --- Agregar producto al carrito --- */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <PackagePlus className="w-3.5 h-3.5" /> Agregar Producto
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Calidad */}
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Calidad</Label>
                  <Select
                    value={itemCalidadId}
                    onChange={(e) => setItemCalidadId(e.target.value)}
                    options={calidades.map((c) => ({ value: String(c.id), label: c.nombre }))}
                    placeholder="Seleccionar..."
                  />
                </div>
                {/* Unidad */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Unidad</Label>
                  <Select
                    value={itemUnidad}
                    onChange={(e) => setItemUnidad(e.target.value)}
                    options={UNIT_OPTIONS}
                  />
                </div>
                {/* Cantidad */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Cantidad</Label>
                  <Input
                    type="number" min="0.01" step="0.01"
                    value={itemCantidad}
                    onChange={(e) => setItemCantidad(e.target.value)}
                    placeholder="0"
                  />
                </div>
                {/* Precio por jaba */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold uppercase text-slate-500">S/ por jaba</Label>
                    {itemCalidadId && (
                      <button type="button" onClick={() => handleOpenEditCalidad(parseInt(itemCalidadId))}
                        className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5">
                        <Pencil className="w-2.5 h-2.5" /> Edit
                      </button>
                    )}
                  </div>
                  <Input
                    type="number" min="0" step="0.01"
                    value={itemPrecio}
                    onChange={(e) => setItemPrecio(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              {/* Lote FIFO */}
              {itemLotes.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Lote (FIFO sugerido)</Label>
                  <Select
                    value={itemCompraId}
                    onChange={(e) => setItemCompraId(e.target.value)}
                    options={itemLotes.map((l: any) => ({
                      value: String(l.compra_id),
                      label: `#${l.compra_id} · ${Number(l.jabas_restantes).toFixed(2)} jabas disp. · ${new Date(l.fecha_compra).toLocaleDateString()}`,
                    }))}
                  />
                </div>
              )}
              {/* Subtotal preview */}
              {itemCantidad && itemPrecio && (
                <div className="flex items-center justify-between text-xs bg-white rounded-xl px-3 py-2 border border-slate-200">
                  <span className="text-slate-500">{itemCantidad} {itemUnidad} = {itemJabas.toFixed(4)} jabas</span>
                  <span className="font-black text-emerald-700">{formatCurrency(itemSubtotal)}</span>
                </div>
              )}
              <Button type="button" onClick={addToCart} variant="outline" className="w-full gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <Plus className="w-4 h-4" /> Agregar al Pedido
              </Button>
            </div>

            {/* --- Carrito de items agregados --- */}
            {cart.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Pedido ({cart.length} producto{cart.length > 1 ? "s" : ""})
                </p>
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  {cart.map((item, idx) => {
                    const jabas = toJabas(Number(item.cantidad_unidades), item.unidad_medida);
                    const sub = jabas * Number(item.precio_por_jaba);
                    return (
                      <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-900">{item.calidad_nombre}</p>
                          <p className="text-xs text-slate-500">
                            {item.cantidad_unidades} {item.unidad_medida} · {jabas.toFixed(3)} jabas · S/{Number(item.precio_por_jaba).toFixed(2)}/jaba
                            {item.compra_id && <span className="ml-1 text-slate-400">· Lote #{item.compra_id}</span>}
                          </p>
                        </div>
                        <span className="font-extrabold text-slate-800 text-sm whitespace-nowrap">{formatCurrency(sub)}</span>
                        <button type="button" onClick={() => removeFromCart(item.id)} className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  {/* Total row */}
                  <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-t border-emerald-200">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total del Pedido</p>
                      <p className="text-xs text-emerald-600">{cartTotals.jabas.toFixed(3)} jabas totales</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-900">{formatCurrency(cartTotals.subtotal)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notas */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-600">Notas del pedido</Label>
              <Input value={notasVenta} onChange={(e) => setNotasVenta(e.target.value)} placeholder="Detalles adicionales..." />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => { resetModal(); setModalVentaOpen(false); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={cart.length === 0} className="shadow-md gap-2">
                <DollarSign className="w-4 h-4" />
                Confirmar Venta {cart.length > 0 && `(${cart.length} producto${cart.length > 1 ? "s" : ""})`}
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
            description={`Cliente: ${abonoVenta.cliente || "Sin nombre"} • Deuda: ${formatCurrency(Number(abonoVenta.saldo_pendiente))}`}
          >
            <form onSubmit={handleAbono} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">Monto a Abonar (S/)</Label>
                <Input type="number" step="0.01" value={abonoMonto} onChange={(e) => setAbonoMonto(e.target.value)} required min="0.01" max={Number(abonoVenta.saldo_pendiente)} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">Fecha del Pago</Label>
                <Input type="date" value={abonoFecha} onChange={(e) => setAbonoFecha(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">Método (Yape, Plin, Efectivo...)</Label>
                <Input value={abonoNotas} onChange={(e) => setAbonoNotas(e.target.value)} placeholder="Ej. Transferencia BCP" />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setAbonoVenta(null)}>Cancelar</Button>
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
            title={`Configuración: ${calidades.find((c) => c.id === editingCalidadId)?.nombre}`}
            description="Ajuste el precio de venta y tiempo de conservación"
          >
            <form onSubmit={handleSaveEditCalidad} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-600">Precio Venta por Jaba (S/)</Label>
                <Input type="number" step="0.01" value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600">Días Conservación Mín.</Label>
                  <Input type="number" value={editConsMin} onChange={(e) => setEditConsMin(e.target.value)} placeholder="Ej. 15" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-slate-600">Días Conservación Máx.</Label>
                  <Input type="number" value={editConsMax} onChange={(e) => setEditConsMax(e.target.value)} placeholder="Ej. 21" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setEditCalidadOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </DialogModal>
        )}
      </div>
    </AppLayout>
  );
}
