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

  createLimpieza: (data: any) =>
    fetchAPI("/api/limpiezas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getLimpiezas: (params?: string) =>
    fetchAPI(`/api/limpiezas${params ? `?${params}` : ""}`),

  createVenta: (data: any) =>
    fetchAPI("/api/ventas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getVentas: (params?: string) =>
    fetchAPI(`/api/ventas${params ? `?${params}` : ""}`),

  getInventario: () => fetchAPI("/api/inventario"),

  getResumen: (params?: string) =>
    fetchAPI(`/api/reportes/resumen${params ? `?${params}` : ""}`),
};
