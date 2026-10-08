"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Egg,
  ShoppingBag,
  ShoppingCart,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  Send,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  LogOut,
  Sparkles,
  ShieldCheck,
  Calendar,
  X,
  FileText
} from "lucide-react";

interface CatalogoItem {
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
  tag: string;
  badgeColor: string;
  stock_jabas: number;
  stock_paquetes: number;
  stock_celdas: number;
  precios: {
    jaba: number;
    paquete: number;
    celda: number;
  };
}

interface CartItem {
  calidad_id: number;
  calidad_nombre: string;
  unidad_medida: "celdas" | "paquetes" | "jabas";
  cantidad_unidades: number;
  precio_unitario: number;
  subtotal: number;
  stock_disponible: number;
}

export default function TiendaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Per-card selected unit & quantity
  const [selectedUnits, setSelectedUnits] = useState<{ [id: number]: "celdas" | "paquetes" | "jabas" }>({});
  const [selectedQuantities, setSelectedQuantities] = useState<{ [id: number]: number }>({});

  // Checkout modal & fields
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [notasPedido, setNotasPedido] = useState("");
  
  // Delivery time strictly 30m to 90m from now
  const [horaEntrega, setHoraEntrega] = useState<string>("");
  const [timeOffsetMinutes, setTimeOffsetMinutes] = useState<number>(45); // default to 45 min

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [successOrder, setSuccessOrder] = useState<any>(null);

  // Initialize data
  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await api.getMe().catch(() => null);
        if (userRes?.user) {
          setCurrentUser(userRes.user);
          if (userRes.user.direccion) setDireccionEntrega(userRes.user.direccion);
          if (userRes.user.telefono) setTelefonoContacto(userRes.user.telefono);
        }

        const catalogoRes = await api.getCatalogo();
        setCatalogo(catalogoRes);

        // Init default units
        const initialUnits: { [id: number]: "celdas" | "paquetes" | "jabas" } = {};
        const initialQty: { [id: number]: number } = {};
        catalogoRes.forEach((item: CatalogoItem) => {
          initialUnits[item.id] = "jabas";
          initialQty[item.id] = 1;
        });
        setSelectedUnits(initialUnits);
        setSelectedQuantities(initialQty);
      } catch (err) {
        console.error("Error loading store:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    function updateScheduledTime() {
      const target = new Date(Date.now() + timeOffsetMinutes * 60 * 1000);
      setHoraEntrega(target.toISOString());
    }
    updateScheduledTime();
    const interval = setInterval(updateScheduledTime, 30000);
    return () => clearInterval(interval);
  }, [timeOffsetMinutes]);

  // Lock body scroll when drawer or modals are open
  useEffect(() => {
    if (isCheckoutOpen || cartOpen || !!successOrder) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isCheckoutOpen, cartOpen, successOrder]);

  // Handle unit change for a card
  const handleUnitChange = (productId: number, unit: "celdas" | "paquetes" | "jabas") => {
    setSelectedUnits((prev) => ({ ...prev, [productId]: unit }));
    setSelectedQuantities((prev) => ({ ...prev, [productId]: 1 }));
  };

  // Get max stock for a product in its selected unit
  const getMaxStockForProduct = (product: CatalogoItem, unit: "celdas" | "paquetes" | "jabas") => {
    switch (unit) {
      case "celdas":
        return product.stock_celdas;
      case "paquetes":
        return product.stock_paquetes;
      case "jabas":
        return Math.floor(product.stock_jabas);
    }
  };

  // Get unit price
  const getUnitPrice = (product: CatalogoItem, unit: "celdas" | "paquetes" | "jabas") => {
    switch (unit) {
      case "celdas":
        return product.precios.celda;
      case "paquetes":
        return product.precios.paquete;
      case "jabas":
        return product.precios.jaba;
    }
  };

  // Add to cart
  const handleAddToCart = (product: CatalogoItem) => {
    const unit = selectedUnits[product.id] || "jabas";
    const qty = selectedQuantities[product.id] || 1;
    const maxStock = getMaxStockForProduct(product, unit);

    if (qty > maxStock) {
      alert(`No hay suficiente stock. Máximo disponible: ${maxStock} ${unit}`);
      return;
    }

    const price = getUnitPrice(product, unit);
    const subtotal = Number((price * qty).toFixed(2));

    setCart((prev) => {
      // If already in cart with same product and unit, update quantity
      const existingIdx = prev.findIndex(
        (item) => item.calidad_id === product.id && item.unidad_medida === unit
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].cantidad_unidades + qty;
        if (newQty > maxStock) {
          alert(`Cantidad total excede el stock disponible (${maxStock} ${unit})`);
          return prev;
        }
        updated[existingIdx].cantidad_unidades = newQty;
        updated[existingIdx].subtotal = Number((price * newQty).toFixed(2));
        return updated;
      } else {
        return [
          ...prev,
          {
            calidad_id: product.id,
            calidad_nombre: product.nombre,
            unidad_medida: unit,
            cantidad_unidades: qty,
            precio_unitario: price,
            subtotal,
            stock_disponible: maxStock,
          },
        ];
      }
    });

    setCartOpen(true);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (newQty > item.stock_disponible) {
        alert(`Stock máximo disponible: ${item.stock_disponible} ${item.unidad_medida}`);
        return prev;
      }
      item.cantidad_unidades = newQty;
      item.subtotal = Number((item.precio_unitario * newQty).toFixed(2));
      return updated;
    });
  };

  // Cart totals
  const totalCartAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const totalCartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.cantidad_unidades, 0);
  }, [cart]);

  // Delivery Time Validation (Strict rule: 30 to 90 minutes from now)
  const deliveryTimeValidation = useMemo(() => {
    if (!horaEntrega) return { valid: false, message: "Seleccione una hora de entrega" };
    const now = new Date();
    const target = new Date(horaEntrega);
    const diffMin = (target.getTime() - now.getTime()) / (1000 * 60);

    if (diffMin < 29.5) {
      return {
        valid: false,
        message: `Hora muy pronta (${Math.round(diffMin)} min). El tiempo mínimo de entrega es de 30 minutos desde la hora actual.`,
      };
    }
    if (diffMin > 90.5) {
      return {
        valid: false,
        message: `Hora muy lejana (${Math.round(diffMin)} min). El tiempo máximo permitido es de 90 minutos (1 hora y media).`,
      };
    }
    return {
      valid: true,
      diffMinutes: Math.round(diffMin),
      formattedTime: target.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  }, [horaEntrega]);

  // Quick preset offsets in minutes
  const quickTimePresets = [
    { label: "+30 min (Express)", minutes: 30 },
    { label: "+45 min", minutes: 45 },
    { label: "+60 min (1 Hora)", minutes: 60 },
    { label: "+90 min (Máximo)", minutes: 90 },
  ];

  // Submit Order
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (!deliveryTimeValidation.valid) {
      setCheckoutError(deliveryTimeValidation.message || "Horario no permitido: La entrega debe ser entre 30 y 90 minutos.");
      return;
    }

    if (!direccionEntrega || !direccionEntrega.trim()) {
      setCheckoutError("Debe ingresar la dirección de entrega.");
      return;
    }

    if (cart.length === 0) {
      setCheckoutError("El carrito de compras está vacío.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const response = await api.createPedido({
        hora_entrega: horaEntrega,
        direccion_entrega: direccionEntrega.trim(),
        telefono_contacto: telefonoContacto.trim() || undefined,
        notas: notasPedido.trim() || undefined,
        items: cart.map((i) => ({
          calidad_id: i.calidad_id,
          unidad_medida: i.unidad_medida,
          cantidad_unidades: i.cantidad_unidades,
        })),
      });

      setSuccessOrder(response);
      setCart([]);
      setIsCheckoutOpen(false);
    } catch (err: any) {
      setCheckoutError(err.message || "Error al procesar el pedido.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/tienda" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Egg className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight text-base sm:text-lg block leading-none">
                Huevos Don Lucho
              </span>
              <span className="text-[10px] sm:text-xs text-emerald-400 font-medium tracking-wider uppercase block mt-0.5">
                Catálogo Directo de Granja
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Hola, <strong className="text-white">{currentUser.nombre}</strong></span>
              </div>
            )}

            <Link
              href="/cliente/pedidos"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Mis Pedidos</span>
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-emerald-900/30"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Pedido</span>
              {totalCartItemsCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-xs font-extrabold px-1.5 py-0.5 rounded-full">
                  {totalCartItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Despacho Programado de Huevos Frescos
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Seleccione su Calidad y Unidad de Medida
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Disponibilidad real de inventario en tiempo real. Elija entre <strong>Celdas (30 huevos)</strong>, <strong>Paquetes (180 huevos)</strong> o <strong>Jabas (360 huevos)</strong> con entrega programada estricta de 30 a 90 minutos.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Entrega de 30 a 90 min</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stock Real Garantizado</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700">
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>Notificación Inmediata vía WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Catálogo Disponible</h2>
            <p className="text-xs sm:text-sm text-slate-400">Precios actualizados y cálculo dinámico por unidad</p>
          </div>
          <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
            1 Jaba = 2 Paquetes = 12 Celdas
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            <div className="h-96 rounded-3xl bg-slate-800/60" />
            <div className="h-96 rounded-3xl bg-slate-800/60" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {catalogo.map((product) => {
              const currentUnit = selectedUnits[product.id] || "jabas";
              const currentQty = selectedQuantities[product.id] || 1;
              const maxStock = getMaxStockForProduct(product, currentUnit);
              const unitPrice = getUnitPrice(product, currentUnit);
              const isOutOfStock = maxStock <= 0;

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col bg-slate-950/80 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl hover:border-slate-700 transition-all duration-200"
                >
                  {/* Visual Reference Image Header */}
                  <div className="relative w-full h-64 sm:h-72 bg-slate-900 overflow-hidden">
                    <img
                      src={product.imagen}
                      alt={product.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Tag Badge */}
                    <div className="absolute top-4 left-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-lg ${
                          product.badgeColor === "emerald"
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-500 text-slate-950"
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {product.tag}
                      </span>
                    </div>

                    {/* Stock indicator badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-md ${
                          isOutOfStock
                            ? "bg-rose-500/80 text-white"
                            : "bg-slate-900/80 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-white" : "bg-emerald-400"}`} />
                        {isOutOfStock ? "Agotado" : `${product.stock_jabas.toFixed(1)} jabas en stock`}
                      </span>
                    </div>

                    {/* Title & Price Header over Image */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-md">
                          {product.nombre}
                        </h3>
                        <p className="text-xs text-slate-300 drop-shadow-sm mt-0.5">
                          {product.descripcion}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Content & Interactive Selectors */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    {/* Unit Selector (Celda, Paquete, Jaba) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Unidad de Venta
                        </label>
                        <span className="text-xs text-slate-500">
                          {currentUnit === "celdas" && "1 Celda = 30 huevos"}
                          {currentUnit === "paquetes" && "1 Paquete = 180 huevos"}
                          {currentUnit === "jabas" && "1 Jaba = 360 huevos"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
                        {(["celdas", "paquetes", "jabas"] as const).map((unit) => {
                          const isSelected = currentUnit === unit;
                          const label = unit === "celdas" ? "Celda (30 u.)" : unit === "paquetes" ? "Paquete (180 u.)" : "Jaba (360 u.)";
                          const price = getUnitPrice(product, unit);

                          return (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => handleUnitChange(product.id, unit)}
                              className={`py-2.5 px-2 rounded-xl text-center transition-all ${
                                isSelected
                                  ? "bg-emerald-600 text-white font-bold shadow-md"
                                  : "text-slate-400 hover:text-white hover:bg-slate-800"
                              }`}
                            >
                              <div className="text-xs font-semibold">{label}</div>
                              <div className="text-[11px] opacity-80 mt-0.5">
                                S/. {price.toFixed(2)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity & Available Stock */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-slate-400">
                          Cantidad a Pedir
                        </span>
                        <span className={`${isOutOfStock ? "text-rose-400" : "text-emerald-400"} font-medium`}>
                          Disponible: <strong>{maxStock}</strong> {currentUnit}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1">
                          <button
                            type="button"
                            disabled={currentQty <= 1 || isOutOfStock}
                            onClick={() =>
                              setSelectedQuantities((prev) => ({
                                ...prev,
                                [product.id]: Math.max(1, currentQty - 1),
                              }))
                            }
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={maxStock}
                            value={currentQty}
                            disabled={isOutOfStock}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              const bounded = Math.min(Math.max(1, val), maxStock || 1);
                              setSelectedQuantities((prev) => ({ ...prev, [product.id]: bounded }));
                            }}
                            className="w-16 bg-transparent text-center font-extrabold text-white text-base focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={currentQty >= maxStock || isOutOfStock}
                            onClick={() =>
                              setSelectedQuantities((prev) => ({
                                ...prev,
                                [product.id]: Math.min(maxStock, currentQty + 1),
                              }))
                            }
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Calculated Subtotal for this card */}
                        <div className="flex-1 text-right">
                          <span className="text-xs text-slate-400 block">Subtotal:</span>
                          <span className="text-xl font-black text-amber-400">
                            S/. {(unitPrice * currentQty).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                      className={`w-full h-12 rounded-2xl font-bold shadow-lg gap-2 text-sm ${
                        isOutOfStock
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {isOutOfStock ? "Sin Stock Disponible" : "Agregar al Pedido"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart Drawer / Slide-Over */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setCartOpen(false)}
          />

          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl z-10 animate-slide-in">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Tu Pedido</h3>
                  <p className="text-xs text-slate-400">{cart.length} productos agregados</p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {cart.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
                  <Egg className="w-12 h-12 text-slate-600" />
                  <p className="text-sm">Tu carrito está vacío.</p>
                  <p className="text-xs text-slate-500">Selecciona huevos de primera o cuarta calidad en el catálogo.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.calidad_id}-${item.unidad_medida}`}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm">{item.calidad_nombre}</h4>
                        <span className="text-xs text-emerald-400 uppercase font-semibold">
                          Unidad: {item.unidad_medida}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                        <button
                          onClick={() => handleUpdateCartQty(idx, item.cantidad_unidades - 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-white">
                          {item.cantidad_unidades}
                        </span>
                        <button
                          onClick={() => handleUpdateCartQty(idx, item.cantidad_unidades + 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">
                          S/. {item.precio_unitario.toFixed(2)} c/u
                        </span>
                        <span className="text-sm font-extrabold text-amber-400">
                          S/. {item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/50 space-y-4">
              <div className="flex items-center justify-between text-base">
                <span className="text-slate-400 font-medium">Total a Pagar:</span>
                <span className="text-2xl font-black text-amber-400">
                  S/. {totalCartAmount.toFixed(2)}
                </span>
              </div>

              <Button
                disabled={cart.length === 0}
                onClick={() => {
                  setCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-900/30 gap-2"
              >
                <span>Proceder al Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal with Strict Time Window and Delivery Form */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in"
            onClick={() => !submittingOrder && setIsCheckoutOpen(false)}
          />

          <div 
            className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden animate-scale-in max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] w-[calc(100%-0.75rem)] sm:w-full"
            style={{ maxHeight: "calc(100dvh - 2rem)" }}
          >
            {/* Header - Fijo arriba */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 flex-shrink-0 bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">Confirmar Entrega y Horario</h3>
                  <p className="text-xs text-slate-400">Regla estricta: Despacho entre 30 y 90 minutos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmOrder} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Body - Único elemento con scroll interno */}
              <div className="overflow-y-auto flex-1 min-h-0 p-4 sm:p-6 space-y-5 overscroll-contain">
                {checkoutError && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Delivery Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-dir" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Dirección de Entrega *
                  </Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <Input
                      id="checkout-dir"
                      value={direccionEntrega}
                      onChange={(e) => setDireccionEntrega(e.target.value)}
                      placeholder="Ej. Calle Los Tulipanes 456, Urb. Santa Anita"
                      className="pl-10 bg-slate-950 border-slate-800 text-white"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-tel" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Teléfono / WhatsApp de Contacto
                  </Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                    <Input
                      id="checkout-tel"
                      value={telefonoContacto}
                      onChange={(e) => setTelefonoContacto(e.target.value)}
                      placeholder="987 654 321"
                      className="pl-10 bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                </div>

                {/* Delivery Time Selector (STRICT RULE: 30 to 90 minutes) */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                      <Clock className="w-4 h-4" />
                      <span>Programación de Hora de Entrega (Obligatorio)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Ventana: 30 a 90 min</span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Por norma operativa, el repartidor requiere un mínimo de <strong>30 minutos</strong> para alistar su pedido y un máximo de <strong>90 minutos</strong>.
                  </p>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {quickTimePresets.map((preset) => (
                      <button
                        key={preset.minutes}
                        type="button"
                        onClick={() => {
                          setTimeOffsetMinutes(preset.minutes);
                          setCheckoutError("");
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all min-h-[44px] ${
                          timeOffsetMinutes === preset.minutes
                            ? "bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Time Display & Visual Status */}
                  <div className="pt-2">
                    {deliveryTimeValidation.valid ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>
                          Hora de entrega programada: <strong>{deliveryTimeValidation.formattedTime}</strong> (en aprox. {deliveryTimeValidation.diffMinutes} minutos)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{deliveryTimeValidation.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="checkout-notas" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Instrucciones o Referencias de Entrega
                  </Label>
                  <Input
                    id="checkout-notas"
                    value={notasPedido}
                    onChange={(e) => setNotasPedido(e.target.value)}
                    placeholder="Ej. Casa de rejas blancas, timbre 2, llamar al llegar"
                    className="bg-slate-950 border-slate-800 text-white"
                  />
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Total del Pedido:</span>
                    <span className="text-xs text-slate-500">{totalCartItemsCount} unidades de huevos</span>
                  </div>
                  <span className="text-2xl font-black text-amber-400">
                    S/. {totalCartAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer - Siempre visible, fijo abajo */}
              <div 
                className="flex-shrink-0 bg-slate-900 border-t border-slate-800 p-4 sm:px-6"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
              >
                <Button
                  type="submit"
                  disabled={submittingOrder || !deliveryTimeValidation.valid}
                  className="w-full h-12 min-h-[44px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-900/30 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingOrder ? (
                    <span>Procesando y Notificando al Administrador...</span>
                  ) : (
                    <>
                      <span>Confirmar Pedido Ahora</span>
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal with Mandatory WhatsApp Notification Button */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md animate-fade-in" />

          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 animate-scale-in text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-white">¡Pedido Confirmado con Éxito!</h3>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                Orden #{successOrder.pedido?.id || "N/A"}
              </p>
            </div>

            {/* Mandatory Highlight: Total Quantity and Exact Delivery Time */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs text-slate-400">Hora Exacta de Entrega:</span>
                <span className="text-sm font-extrabold text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(successOrder.pedido?.hora_entrega).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>

              <div className="border-b border-slate-800/80 pb-2.5">
                <span className="text-xs text-slate-400 block mb-1">Cantidad Total Solicitada:</span>
                <div className="space-y-1">
                  {successOrder.pedido?.items?.map((item: any) => (
                    <div key={item.id} className="text-xs font-semibold text-slate-200 flex justify-between">
                      <span>• {item.cantidad_unidades} {item.unidad_medida} de {item.calidad?.nombre || "Huevos"}</span>
                      <span className="text-slate-400">S/. {Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Dirección:</span>
                <span className="text-slate-200 font-medium truncate max-w-[240px]">
                  {successOrder.pedido?.direccion_entrega}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800/80">
                <span className="text-slate-300 font-bold">Total a Pagar:</span>
                <span className="text-lg font-black text-amber-400">
                  S/. {Number(successOrder.pedido?.total).toFixed(2)}
                </span>
              </div>
            </div>

            {/* WhatsApp Notification Button */}
            {successOrder.notificacion?.whatsappUrl && (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  Se ha generado la notificación automática al Administrador. Puede abrir WhatsApp para confirmar directamente:
                </p>
                <a
                  href={successOrder.notificacion.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/40 transition-transform hover:scale-[1.02]"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Alerta a WhatsApp del Administrador</span>
                </a>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/cliente/pedidos"
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold text-center transition-colors"
              >
                Ver Mis Pedidos
              </Link>
              <button
                onClick={() => setSuccessOrder(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Seguir Comprando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
