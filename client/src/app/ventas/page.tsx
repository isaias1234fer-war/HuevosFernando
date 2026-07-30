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
import { Pencil, Trash2, Plus } from "lucide-react";
import AppLayout from "@/app/layout-wrapper";

export default function VentasPage() {
  const [calidades, setCalidades] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [calidadId, setCalidadId] = useState("");
  const [cantidadJabas, setCantidadJabas] = useState("");
  const [precioPorJaba, setPrecioPorJaba] = useState("");
  const [notas, setNotas] = useState("");
  const [tipoPago, setTipoPago] = useState("contado");
  const [cliente, setCliente] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtroCalidad, setFiltroCalidad] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [abonoVentaId, setAbonoVentaId] = useState<number | null>(null);
  const [abonoMonto, setAbonoMonto] = useState("");
  const [abonoFecha, setAbonoFecha] = useState("");
  const [abonoNotas, setAbonoNotas] = useState("");
  const [lotes, setLotes] = useState<any[]>([]);
  const [compraId, setCompraId] = useState("");

  const fetchCalidades = useCallback(async () => {
    const data = await api.getCalidades();
    setCalidades(data);
  }, []);

  const fetchVentas = useCallback(async () => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (filtroCalidad) params.set("calidad_id", filtroCalidad);
    if (filtroEstado) params.set("estado_pago", filtroEstado);
    const data = await api.getVentas(params.toString());
    setVentas(data);
  }, [desde, hasta, filtroCalidad, filtroEstado]);

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
    if (!calidadId) { setLotes([]); setCompraId(""); return; }
    api.getLotes().then((data) => {
      const filtrados = data.filter((l: any) => l.calidad_id === parseInt(calidadId) && l.estado !== "vencido" && l.jabas_restantes > 0);
      filtrados.sort((a: any, b: any) => new Date(a.fecha_compra).getTime() - new Date(b.fecha_compra).getTime());
      setLotes(filtrados);
      if (filtrados.length > 0) setCompraId(String(filtrados[0].compra_id));
    }).catch(() => {});
  }, [calidadId]);

  const calidadSeleccionada = calidades.find((c) => String(c.id) === calidadId);
  const total = Number(cantidadJabas) * Number(precioPorJaba) || 0;

  const [editCalidadOpen, setEditCalidadOpen] = useState(false);
  const [editPrecio, setEditPrecio] = useState("");
  const [editConsMin, setEditConsMin] = useState("");
  const [editConsMax, setEditConsMax] = useState("");

  const handleOpenEditCalidad = () => {
    if (!calidadSeleccionada) return;
    setEditPrecio(String(calidadSeleccionada.precio_venta_jaba));
    setEditConsMin(calidadSeleccionada.dias_conservacion_min != null ? String(calidadSeleccionada.dias_conservacion_min) : "");
    setEditConsMax(calidadSeleccionada.dias_conservacion_max != null ? String(calidadSeleccionada.dias_conservacion_max) : "");
    setEditCalidadOpen(true);
  };

  const handleSaveEditCalidad = async () => {
    if (!calidadId) return;
    await api.updateCalidad(parseInt(calidadId), {
      precio_venta_jaba: editPrecio,
      dias_conservacion_min: editConsMin ? parseInt(editConsMin) : null,
      dias_conservacion_max: editConsMax ? parseInt(editConsMax) : null,
    });
    await fetchCalidades();
    setPrecioPorJaba(editPrecio);
    setEditCalidadOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createVenta({
      calidad_id: parseInt(calidadId),
      cantidad_jabas: parseInt(cantidadJabas),
      precio_por_jaba: precioPorJaba,
      notas,
      tipo_pago: tipoPago,
      cliente: tipoPago === "fiado" ? cliente : undefined,
      compra_id: compraId || undefined,
    });
    setCantidadJabas("");
    setPrecioPorJaba("");
    setNotas("");
    setCliente("");
    setCompraId("");
    fetchVentas();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta venta?")) return;
    setDeleting(id);
    try {
      await api.deleteVenta(id);
      fetchVentas();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonoVentaId) return;
    try {
      await api.createPago({
        venta_id: abonoVentaId,
        monto: abonoMonto,
        fecha: abonoFecha || undefined,
        notas: abonoNotas || undefined,
      });
      setAbonoVentaId(null);
      setAbonoMonto("");
      setAbonoFecha("");
      setAbonoNotas("");
      fetchVentas();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const badgeClass = (estado: string) => {
    switch (estado) {
      case "pagado": return "bg-green-100 text-green-700";
      case "parcial": return "bg-yellow-100 text-yellow-700";
      case "pendiente": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Ventas</h1>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Venta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Calidad</Label>
                <Select
                  value={calidadId}
                  onChange={(e) => setCalidadId(e.target.value)}
                  options={calidades.map((c) => ({
                    value: String(c.id),
                    label: `${c.nombre} - S/ ${c.precio_venta_jaba}/jaba`,
                  }))}
                  placeholder="Seleccionar calidad"
                  required
                />
              </div>
              {lotes.length > 0 && (
                <div className="space-y-2">
                  <Label>Lote (FIFO sugerido)</Label>
                  <Select
                    value={compraId}
                    onChange={(e) => setCompraId(e.target.value)}
                    options={lotes.map((l: any) => ({
                      value: String(l.compra_id),
                      label: `#${l.compra_id} - ${l.jabas_restantes} jabas disp. (${new Date(l.fecha_compra).toLocaleDateString()})`,
                    }))}
                    placeholder="Sin asignar lote"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Cantidad (jabas)</Label>
                <Input
                  type="number" value={cantidadJabas}
                  onChange={(e) => setCantidadJabas(e.target.value)}
                  required min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Precio por jaba (S/)
                  {calidadSeleccionada && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (establecido: S/{Number(calidadSeleccionada.precio_venta_jaba).toFixed(2)})
                    </span>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number" step="0.01" value={precioPorJaba}
                    onChange={(e) => setPrecioPorJaba(e.target.value)}
                    required min="0"
                  />
                  {calidadId && (
                    <Button type="button" variant="outline" size="icon" onClick={handleOpenEditCalidad} title="Editar configuración de calidad">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de pago</Label>
                <Select
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value)}
                  options={[
                    { value: "contado", label: "Al contado" },
                    { value: "fiado", label: "Al fiado" },
                  ]}
                />
              </div>
              {tipoPago === "fiado" && (
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nombre del cliente" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={notas} onChange={(e) => setNotas(e.target.value)} />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <p className="text-sm text-muted-foreground mb-1">
                  Total: <span className="font-bold text-lg">{formatCurrency(total)}</span>
                </p>
                <Button type="submit">Registrar Venta</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-36" />
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-36" />
              <Select
                value={filtroCalidad}
                onChange={(e) => setFiltroCalidad(e.target.value)}
                options={calidades.map((c) => ({ value: String(c.id), label: c.nombre }))}
                placeholder="Todas las calidades"
                className="w-44"
              />
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                options={[
                  { value: "pagado", label: "Pagado" },
                  { value: "parcial", label: "Parcial" },
                  { value: "pendiente", label: "Pendiente" },
                ]}
                placeholder="Todos los estados"
                className="w-36"
              />
              <Button onClick={fetchVentas}>Filtrar</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Jabas</TableHead>
                  <TableHead>Precio/jaba</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{formatDate(v.fecha)}</TableCell>
                    <TableCell>{v.calidad.nombre}</TableCell>
                    <TableCell>{v.cantidad_jabas}</TableCell>
                    <TableCell>{formatCurrency(Number(v.precio_por_jaba))}</TableCell>
                    <TableCell>{formatCurrency(Number(v.total))}</TableCell>
                    <TableCell>
                      <span className={v.tipo_pago === "fiado" ? "text-orange-600 font-medium" : "text-green-600"}>{v.tipo_pago}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badgeClass(v.estado_pago)}`}>{v.estado_pago}</span>
                    </TableCell>
                    <TableCell>{v.cliente || "-"}</TableCell>
                    <TableCell className="font-medium">{v.tipo_pago === "fiado" ? formatCurrency(Number(v.saldo_pendiente)) : "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.compra_id ? `#${v.compra_id}` : "-"}</TableCell>
                    <TableCell>{v.notas || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {v.tipo_pago === "fiado" && Number(v.saldo_pendiente) > 0 && (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => {
                              setAbonoVentaId(v.id);
                              setAbonoMonto(String(Number(v.saldo_pendiente)));
                              setAbonoFecha("");
                              setAbonoNotas("");
                            }}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            title="Registrar abono"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleDelete(v.id)}
                          disabled={deleting === v.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {editCalidadOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditCalidadOpen(false)}>
            <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>Configurar: {calidadSeleccionada?.nombre}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Precio venta por jaba (S/)</Label>
                    <Input type="number" step="0.01" value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Días conservación mínimos</Label>
                    <Input type="number" value={editConsMin} onChange={(e) => setEditConsMin(e.target.value)} placeholder="Ej: 15" />
                  </div>
                  <div className="space-y-2">
                    <Label>Días conservación máximos</Label>
                    <Input type="number" value={editConsMax} onChange={(e) => setEditConsMax(e.target.value)} placeholder="Ej: 21" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setEditCalidadOpen(false)}>Cancelar</Button>
                    <Button type="button" onClick={handleSaveEditCalidad}>Guardar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {abonoVentaId && (
            <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>Registrar Abono</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAbono} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Monto (S/)</Label>
                    <Input type="number" step="0.01" value={abonoMonto} onChange={(e) => setAbonoMonto(e.target.value)} required min="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" value={abonoFecha} onChange={(e) => setAbonoFecha(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Input value={abonoNotas} onChange={(e) => setAbonoNotas(e.target.value)} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setAbonoVentaId(null)}>Cancelar</Button>
                    <Button type="submit">Registrar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
