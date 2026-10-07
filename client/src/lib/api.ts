const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Error de conexión" }));
    throw new Error(error.error || `Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    fetchAPI("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (data: {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
    direccion?: string;
  }) =>
    fetchAPI("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => fetchAPI("/api/auth/me"),

  logout: () =>
    fetchAPI("/api/auth/logout", { method: "POST" }),

  getCalidades: () => fetchAPI("/api/calidades"),

  updateCalidad: (id: number, data: any) =>
    fetchAPI(`/api/calidades/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  createCompra: (data: any) =>
    fetchAPI("/api/compras", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCompras: (params?: string) =>
    fetchAPI(`/api/compras${params ? `?${params}` : ""}`),

  deleteCompra: (id: number) =>
    fetchAPI(`/api/compras/${id}`, { method: "DELETE" }),

  createLimpieza: (data: any) =>
    fetchAPI("/api/limpiezas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getLimpiezas: (params?: string) =>
    fetchAPI(`/api/limpiezas${params ? `?${params}` : ""}`),

  deleteLimpieza: (id: number) =>
    fetchAPI(`/api/limpiezas/${id}`, { method: "DELETE" }),

  createVenta: (data: any) =>
    fetchAPI("/api/ventas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createVentaLote: (data: any) =>
    fetchAPI("/api/ventas/lote", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getVentas: (params?: string) =>
    fetchAPI(`/api/ventas${params ? `?${params}` : ""}`),

  getVentaPagos: (id: number) =>
    fetchAPI(`/api/ventas/${id}/pagos`),

  deleteVenta: (id: number) =>
    fetchAPI(`/api/ventas/${id}`, { method: "DELETE" }),

  createPago: (data: any) =>
    fetchAPI("/api/pagos", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInventario: () => fetchAPI("/api/inventario"),

  getCatalogo: () => fetchAPI("/api/inventario/catalogo"),

  getLotes: () => fetchAPI("/api/inventario/lotes"),

  getVencimientos: () => fetchAPI("/api/inventario/vencimientos"),

  getResumen: (params?: string) =>
    fetchAPI(`/api/reportes/resumen${params ? `?${params}` : ""}`),

  createPedido: (data: {
    hora_entrega: string;
    direccion_entrega: string;
    telefono_contacto?: string;
    notas?: string;
    items: {
      calidad_id: number;
      unidad_medida: string;
      cantidad_unidades: number;
    }[];
  }) =>
    fetchAPI("/api/pedidos", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPedidos: () => fetchAPI("/api/pedidos"),

  updatePedidoEstado: (id: number, estado: string) =>
    fetchAPI(`/api/pedidos/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }),
};
