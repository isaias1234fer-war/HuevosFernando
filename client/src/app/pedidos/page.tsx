"use client";

import { useState, useEffect } from "react";
import AppLayout from "../layout-wrapper";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  Calendar,
  Send,
  Filter,
  RefreshCw
} from "lucide-react";

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadPedidos = async () => {
    setLoading(true);
    try {
      const data = await api.getPedidos();
      setPedidos(data);
    } catch (err) {
      console.error("Error al cargar pedidos admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  const handleUpdateEstado = async (id: number, nuevoEstado: string) => {
    setUpdatingId(id);
    try {
      await api.updatePedidoEstado(id, nuevoEstado);
      await loadPedidos();
    } catch (err: any) {
      alert(err.message || "Error al actualizar estado");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredPedidos = pedidos.filter((p) => {
    if (filtroEstado === "todos") return true;
    return p.estado === filtroEstado;
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pendiente
          </span>
        );
      case "confirmado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            Confirmado / Preparando
          </span>
        );
      case "en_camino":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Truck className="w-3.5 h-3.5 text-purple-600" />
            En Camino
          </span>
        );
      case "entregado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Entregado
          </span>
        );
      case "cancelado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Cancelado
          </span>
        );
      default:
        return <span>{estado}</span>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Pedidos de Clientes
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Control de despachos programados con ventana estricta de 30 a 90 minutos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={loadPedidos}
              variant="outline"
              className="gap-2 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          {[
            { id: "todos", label: "Todos" },
            { id: "pendiente", label: "Pendientes" },
            { id: "confirmado", label: "Confirmados" },
            { id: "en_camino", label: "En Camino" },
            { id: "entregado", label: "Entregados" },
            { id: "cancelado", label: "Cancelados" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                filtroEstado === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
              {tab.id === "todos" && ` (${pedidos.length})`}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 rounded-3xl bg-slate-100" />
            <div className="h-40 rounded-3xl bg-slate-100" />
          </div>
        ) : filteredPedidos.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 space-y-3 shadow-xs">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No hay pedidos en esta categoría</h3>
            <p className="text-xs text-slate-500">
              Los nuevos pedidos de clientes ingresarán aquí con su horario programado.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPedidos.map((pedido) => {
              const deliveryDate = new Date(pedido.hora_entrega);
              const orderDate = new Date(pedido.fecha_pedido);

              return (
                <div
                  key={pedido.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
                        #{pedido.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">
                            {pedido.usuario?.nombre || "Cliente"}
                          </h3>
                          {pedido.usuario?.email && (
                            <span className="text-xs text-slate-400">({pedido.usuario.email})</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Pedido realizado:{" "}
                          {orderDate.toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(pedido.estado)}

                      {/* WhatsApp direct contact */}
                      {pedido.telefono_contacto && (
                        <a
                          href={`https://wa.me/${pedido.telefono_contacto.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Contactar WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Highlights Grid: Scheduled Delivery Time & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Scheduled Delivery Time Highlight */}
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>HORA EXACTA PROGRAMADA DE ENTREGA</span>
                      </div>
                      <div className="text-lg font-black text-amber-900">
                        {deliveryDate.toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}{" "}
                        <span className="text-xs font-semibold text-amber-700">
                          ({deliveryDate.toLocaleDateString("es-PE")})
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-700/80">
                        Ventana estricta de 30 a 90 minutos acordada con el cliente.
                      </p>
                    </div>

                    {/* Delivery Address & Contact */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>DIRECCIÓN DE ENTREGA Y CONTACTO</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {pedido.direccion_entrega}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <span>Teléfono: {pedido.telefono_contacto || "No especificado"}</span>
                        {pedido.notas && <span className="italic">• Nota: &quot;{pedido.notas}&quot;</span>}
                      </div>
                    </div>
                  </div>

                  {/* Items breakdown */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Cantidad Total Solicitada:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {pedido.items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              {item.cantidad_unidades} {item.unidad_medida}
                            </span>
                            <span className="text-slate-500">
                              {item.calidad?.nombre || "Huevos"} ({Number(item.cantidad_jabas).toFixed(2)} jabas)
                            </span>
                          </div>
                          <span className="font-bold text-emerald-700">
                            S/. {Number(item.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer & State actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500">Total a cobrar:</span>
                      <span className="text-xl font-black text-slate-900">
                        S/. {Number(pedido.total).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold mr-1">
                        Cambiar Estado:
                      </span>
                      {pedido.estado !== "confirmado" && (
                        <button
                          disabled={updatingId === pedido.id}
                          onClick={() => handleUpdateEstado(pedido.id, "confirmado")}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          Confirmar
                        </button>
                      )}
                      {pedido.estado !== "en_camino" && (
                        <button
                          disabled={updatingId === pedido.id}
                          onClick={() => handleUpdateEstado(pedido.id, "en_camino")}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                        >
                          En Camino
                        </button>
                      )}
                      {pedido.estado !== "entregado" && (
                        <button
                          disabled={updatingId === pedido.id}
                          onClick={() => handleUpdateEstado(pedido.id, "entregado")}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          Entregado
                        </button>
                      )}
                      {pedido.estado !== "cancelado" && (
                        <button
                          disabled={updatingId === pedido.id}
                          onClick={() => handleUpdateEstado(pedido.id, "cancelado")}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
