"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Package, AlertCircle, Clock, Ban } from "lucide-react";
import AppLayout from "@/app/layout-wrapper";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function InventarioPage() {
  const [inventario, setInventario] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);

  useEffect(() => {
    api.getInventario().then(setInventario);
    api.getLotes().then(setLotes);
  }, []);

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case "vigente": return "bg-green-100 text-green-700";
      case "por_vencer": return "bg-yellow-100 text-yellow-700";
      case "vencido": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const jabasPorVencer = lotes.filter((l) => l.estado === "por_vencer").reduce((s, l) => s + l.jabas_restantes, 0);
  const jabasVencidas = lotes.filter((l) => l.estado === "vencido").reduce((s, l) => s + l.jabas_restantes, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Inventario</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventario.map((item) => (
            <Card key={item.calidad_id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.calidad_nombre}</p>
                    <p className="text-3xl font-bold mt-1">{item.disponible_jabas}</p>
                    <p className="text-xs text-muted-foreground">jabas disponibles</p>
                  </div>
                  <div className={`p-3 rounded-full ${item.disponible_jabas > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    {item.disponible_jabas > 0 ? (
                      <Package className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <p>Compradas: {item.total_compradas_jabas} jabas</p>
                  <p>Rotas: {item.total_rotas_jabas} jabas</p>
                  <p>Vendidas: {item.total_vendidas_jabas} jabas</p>
                  <p>Precio venta: {formatCurrency(item.precio_venta_jaba)}/jaba</p>
                  <p>{item.huevos_por_jaba} huevos/jaba</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jabas por vencer</p>
                  <p className="text-3xl font-bold mt-1 text-yellow-600">{jabasPorVencer}</p>
                  <p className="text-xs text-muted-foreground">a 3 días o menos del vencimiento</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-50">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jabas vencidas</p>
                  <p className="text-3xl font-bold mt-1 text-red-600">{jabasVencidas}</p>
                  <p className="text-xs text-muted-foreground">no aptas para venta</p>
                </div>
                <div className="p-3 rounded-full bg-red-50">
                  <Ban className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Disponible por Calidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventario} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="calidad_nombre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="disponible_jabas" fill="#16a34a" name="Jabas Disponibles" />
                  <Bar dataKey="total_vendidas_jabas" fill="#3b82f6" name="Jabas Vendidas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle de Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Calidad</TableHead>
                  <TableHead>Compradas</TableHead>
                  <TableHead>Rotas</TableHead>
                  <TableHead>Vendidas</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Precio Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventario.map((item) => (
                  <TableRow key={item.calidad_id}>
                    <TableCell className="font-medium">{item.calidad_nombre}</TableCell>
                    <TableCell>{item.total_compradas_jabas}</TableCell>
                    <TableCell>{item.total_rotas_jabas}</TableCell>
                    <TableCell>{item.total_vendidas_jabas}</TableCell>
                    <TableCell className="font-bold">{item.disponible_jabas}</TableCell>
                    <TableCell>{formatCurrency(item.precio_venta_jaba)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lotes / Vencimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {lotes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay lotes con seguimiento de vencimiento</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote #</TableHead>
                    <TableHead>Calidad</TableHead>
                    <TableHead>Fecha Compra</TableHead>
                    <TableHead>Jabas Rest.</TableHead>
                    <TableHead>Vence (mín)</TableHead>
                    <TableHead>Vence (máx)</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotes.map((l) => (
                    <TableRow key={l.compra_id}>
                      <TableCell className="font-mono">{l.compra_id}</TableCell>
                      <TableCell>{l.calidad_nombre}</TableCell>
                      <TableCell>{formatDate(l.fecha_compra)}</TableCell>
                      <TableCell className="font-bold">{l.jabas_restantes}</TableCell>
                      <TableCell>{formatDate(l.fecha_vencimiento_min)}</TableCell>
                      <TableCell>{formatDate(l.fecha_vencimiento_max)}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${estadoBadge(l.estado)}`}>{l.estado}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
