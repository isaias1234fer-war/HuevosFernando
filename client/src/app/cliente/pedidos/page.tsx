"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Egg,
  Clock,
  MapPin,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  Calendar,
  LogOut,
  ShoppingBag
} from "lucide-react";

export default function ClientePedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPedidos() {
      try {
        const data = await api.getPedidos();
        setPedidos(data);
      } catch (err) {
        console.error("Error al cargar pedidos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPedidos();
  }, []);

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Pendiente de Confirmación
          </span>
        );
      case "confirmado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Package className="w-3.5 h-3.5" />
            Confirmado / Preparando
          </span>
        );
      case "en_camino":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Truck className="w-3.5 h-3.5" />
            En Camino al Domicilio
          </span>
        );
      case "entregado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Entregado con Éxito
          </span>
        );
      case "cancelado":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/tienda"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                <Egg className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-white text-base sm:text-lg block leading-none">
                  Mis Pedidos
                </span>
                <span className="text-xs text-slate-400">Historial de solicitudes</span>
              </div>
            </div>
          </div>

          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Nuevo Pedido</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Estado de tus Pedidos</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Revisa el horario programado de entrega y el desglose de productos solicitados.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-36 rounded-2xl bg-slate-800/60" />
            <div className="h-36 rounded-2xl bg-slate-800/60" />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-950/60 border border-slate-800 space-y-4">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Aún no tienes pedidos registrados</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Ingresa al catálogo para realizar tu primer pedido de huevos frescos.
              </p>
            </div>
            <Link
              href="/tienda"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explorar Catálogo</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-white">
                      Pedido #PED-{pedido.id}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(pedido.fecha_pedido).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div>{getStatusBadge(pedido.estado)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Delivery Schedule */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 font-medium block flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Hora Exacta de Entrega Programada:
                    </span>
                    <span className="text-sm font-extrabold text-amber-300 block">
                      {new Date(pedido.hora_entrega).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>

                  {/* Delivery Address */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 font-medium block flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Dirección de Envío:
                    </span>
                    <span className="text-xs font-semibold text-slate-200 block truncate">
                      {pedido.direccion_entrega}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Productos Solicitados:
                  </span>
                  <div className="space-y-1.5">
                    {pedido.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/50"
                      >
                        <span className="font-semibold text-slate-200">
                          • {item.cantidad_unidades} {item.unidad_medida} de {item.calidad?.nombre || "Huevos"}
                        </span>
                        <span className="font-bold text-slate-300">
                          S/. {Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-sm">
                  <span className="text-slate-400 font-medium">Total Facturado:</span>
                  <span className="text-xl font-black text-amber-400">
                    S/. {Number(pedido.total).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
