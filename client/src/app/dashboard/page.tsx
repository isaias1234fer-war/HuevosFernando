"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AppLayout from "@/app/layout-wrapper";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, HandCoins, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444"];

export default function DashboardPage() {
  const [resumen, setResumen] = useState<any>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchResumen = useCallback(async () => {
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    const data = await api.getResumen(params.toString());
    setResumen(data);
  }, [desde, hasta]);

  useEffect(() => {
    fetchResumen();
  }, [fetchResumen]);

  const cards = [
    {
      title: "Inversión Total",
      value: resumen?.inversion_total ?? 0,
      icon: TrendingDown,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      title: "Ingresos Totales",
      value: resumen?.ingresos_totales ?? 0,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "Ingresos Cobrados",
      value: resumen?.ingresos_cobrados ?? 0,
      icon: HandCoins,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      title: "Cuentas por Cobrar",
      value: resumen?.cuentas_por_cobrar ?? 0,
      icon: Users,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      title: "Ganancia Neta",
      value: resumen?.ganancia_neta ?? 0,
      icon: DollarSign,
      color: resumen?.ganancia_neta >= 0 ? "text-green-500" : "text-red-500",
      bg: "bg-blue-50",
    },
    {
      title: "Valor de Merma",
      value: resumen?.valor_merma ?? 0,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="desde">Desde</Label>
              <Input
                id="desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="hasta">Hasta</Label>
              <Input
                id="hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={fetchResumen}>Actualizar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(card.value)}
                      </p>
                    </div>
                    <div className={`${card.bg} p-3 rounded-full`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ganancia por Calidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={resumen?.ganancia_por_calidad || []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="calidad_nombre" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="ingresos" fill="#16a34a" name="Ingresos" />
                    <Bar dataKey="inversion" fill="#f59e0b" name="Inversión" />
                    <Bar dataKey="ganancia" fill="#3b82f6" name="Ganancia" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resumen?.ganancia_por_calidad || []}
                      dataKey="ingresos"
                      nameKey="calidad_nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ calidad_nombre, percent }) =>
                        `${calidad_nombre} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {(resumen?.ganancia_por_calidad || []).map((_: any, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
