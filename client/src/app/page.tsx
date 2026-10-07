"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Egg, 
  Lock, 
  User, 
  Mail,
  Phone,
  MapPin,
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  PackageCheck, 
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Clock,
  CheckCircle2
} from "lucide-react";

export default function LoginPage() {
  const [activePortal, setActivePortal] = useState<"cliente" | "admin">("cliente");
  const [isRegistering, setIsRegistering] = useState(false);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas de administrador.");
    } finally {
      setLoading(false);
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(email, password);
      router.push("/tienda");
    } catch (err: any) {
      setError(err.message || "Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!nombre || !email || !password) {
        throw new Error("Nombre, correo y contraseña son obligatorios");
      }
      await api.register({
        nombre,
        email,
        password,
        telefono,
        direccion,
      });
      router.push("/tienda");
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 text-slate-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Left Feature & Branding Hero Section */}
      <div className="relative flex-1 hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border-r border-emerald-900/30 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Egg className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Huevos Don Lucho</h1>
            <p className="text-xs text-emerald-400 font-medium tracking-wider uppercase">
              Venta Directa y Gestión Avícola
            </p>
          </div>
        </div>

        {/* Center Presentation */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Huevos Frescos de Granja • Despacho Rápido
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Pedidos en línea de primera y cuarta calidad con entrega en 30 a 90 minutos.
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Ordene por celdas, paquetes o jabas con stock verificado en tiempo real y programación de entrega garantizada.
          </p>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Entrega Express</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Horario programable entre 30 y 90 minutos.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <PackageCheck className="w-4 h-4 shrink-0" />
                <span>Stock en Vivo</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Disponibilidad real por jabas, paquetes y celdas.</p>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span>&copy; {new Date().getFullYear()} Huevos Don Lucho. Calidad garantizada.</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" /> Plataforma Segura
          </span>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-slate-50 text-slate-900 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/80 my-auto">
          {/* Mobile Header */}
          <div className="text-center space-y-2">
            <div className="lg:hidden flex justify-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <Egg className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activePortal === "cliente" ? "Portal de Pedidos" : "Panel Administrativo"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {activePortal === "cliente"
                ? "Ordene sus huevos frescos con entrega programada"
                : "Acceso exclusivo para el personal de administración"}
            </p>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActivePortal("cliente");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                activePortal === "cliente"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Clientes</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePortal("admin");
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                activePortal === "admin"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Administrador</span>
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* CLIENT PORTAL: LOGIN OR REGISTER */}
          {activePortal === "cliente" && (
            <div>
              {/* Sub-tabs: Iniciar Sesión / Registrarse */}
              <div className="flex border-b border-slate-200 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError("");
                  }}
                  className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${
                    !isRegistering
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setError("");
                  }}
                  className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${
                    isRegistering
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Crear Cuenta Nueva
                </button>
              </div>

              {!isRegistering ? (
                /* Cliente Login Form */
                <form onSubmit={handleClientLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="client-email" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Correo Electrónico
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                      <Input
                        id="client-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="pl-10"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="client-pass" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                      <Input
                        id="client-pass"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md gap-2 rounded-xl mt-2"
                  >
                    {loading ? (
                      <span>Verificando...</span>
                    ) : (
                      <>
                        <span>Ingresar a la Tienda</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                /* Cliente Registration Form */
                <form onSubmit={handleClientRegister} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label htmlFor="reg-nombre" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Nombre Completo *
                    </Label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                      <Input
                        id="reg-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Juan Pérez"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Correo Electrónico *
                    </Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                      <Input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan@correo.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="reg-tel" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Teléfono / WhatsApp
                      </Label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <Input
                          id="reg-tel"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                          placeholder="999 999 999"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reg-pass" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Contraseña *
                      </Label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                        <Input
                          id="reg-pass"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-dir" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Dirección de Entrega Habitual
                    </Label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                      <Input
                        id="reg-dir"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Av. Los Fresnos 123, Mz B Lote 4"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md gap-2 rounded-xl mt-2"
                  >
                    {loading ? (
                      <span>Creando cuenta...</span>
                    ) : (
                      <>
                        <span>Registrarse e Iniciar Pedido</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ADMIN PORTAL: LOGIN FORM */}
          {activePortal === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-user" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Usuario Administrador
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <Input
                    id="admin-user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-pass" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <Input
                    id="admin-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-md gap-2 rounded-xl"
              >
                {loading ? (
                  <span>Ingresando al sistema...</span>
                ) : (
                  <>
                    <span>Acceder a Gestión</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Huevos Don Lucho • Avícola de Confianza • Envíos Programados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
