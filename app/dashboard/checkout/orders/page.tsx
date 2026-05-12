"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  Search,
  Eye,
  Send,
  Loader2,
  ShoppingCart,
  Filter,
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Order {
  id: string;
  checkout_id: string;
  checkout_name?: string;
  product_name?: string;
  product_type?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_cpf: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip: string | null;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  coupon_code: string | null;
  payment_method: string;
  payment_status: string;
  delivery_status: string;
  tracking_code: string | null;
  status: string;
  created_at: string;
  is_digital?: boolean;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-500/20", text: "text-yellow-500", label: "Pendente" },
  paid: { bg: "bg-blue-500/20", text: "text-blue-500", label: "Pago" },
  processing: { bg: "bg-purple-500/20", text: "text-purple-500", label: "Processando" },
  shipped: { bg: "bg-orange-500/20", text: "text-orange-500", label: "Aguardando Envio" },
  sent: { bg: "bg-blue-500/20", text: "text-blue-500", label: "Enviado" },
  delivered: { bg: "bg-green-500/20", text: "text-green-500", label: "Entregue" },
  cancelled: { bg: "bg-red-500/20", text: "text-red-500", label: "Cancelado" },
  failed: { bg: "bg-red-500/20", text: "text-red-500", label: "Falhou" },
};

const typeColors: Record<string, { bg: string; text: string; label: string }> = {
  digital: { bg: "bg-primary/20", text: "text-primary", label: "Digital" },
  fisico: { bg: "bg-orange-500/20", text: "text-orange-500", label: "Fisico" },
  physical: { bg: "bg-orange-500/20", text: "text-orange-500", label: "Fisico" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"checkouts" | "entregas">("entregas");
  const [detailsModal, setDetailsModal] = useState<Order | null>(null);
  const [trackingModal, setTrackingModal] = useState<Order | null>(null);
  const [trackingCode, setTrackingCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetch("/api/checkout/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTracking = async () => {
    if (!trackingModal || !trackingCode) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetch(`/api/checkout/orders/${trackingModal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tracking_code: trackingCode,
          delivery_status: "sent",
        }),
      });

      if (res.ok) {
        await loadOrders();
        setTrackingModal(null);
        setTrackingCode("");
      }
    } catch (err) {
      console.error("Error updating tracking:", err);
    } finally {
      setSaving(false);
    }
  };

  const getProductType = (order: Order) => {
    if (order.product_type) return order.product_type;
    if (order.is_digital !== undefined) return order.is_digital ? "digital" : "fisico";
    return "digital";
  };

  const filteredOrders = orders.filter((order) => {
    const productType = getProductType(order);
    const matchesSearch =
      (order.product_name || order.checkout_name || "").toLowerCase().includes(search.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.shipping_city?.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase());

    const orderStatus = order.delivery_status || order.payment_status || order.status;
    const matchesStatus = statusFilter === "all" || orderStatus === statusFilter;
    const matchesType = typeFilter === "all" || productType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("checkouts")}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
            activeTab === "checkouts"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Checkouts
        </button>
        <button
          onClick={() => setActiveTab("entregas")}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
            activeTab === "entregas"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Truck className="w-4 h-4" />
          Entregas
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Truck className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entregas</h1>
          <p className="text-muted-foreground">Acompanhe as entregas dos seus produtos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por comprador, cidade ou produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-secondary border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="shipped">Aguardando Envio</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] bg-secondary border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="fisico">Fisico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma entrega encontrada
            </h3>
            <p className="text-muted-foreground text-center">
              {search || statusFilter !== "all" || typeFilter !== "all"
                ? "Tente ajustar os filtros"
                : "As entregas aparecerão aqui quando houver pedidos"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Produto
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Comprador
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Cidade/UF
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Rastreio / Link
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const orderStatus = order.delivery_status || order.payment_status || order.status;
                  const status = statusColors[orderStatus] || statusColors.pending;
                  const productType = getProductType(order);
                  const type = typeColors[productType] || typeColors.digital;
                  const isPhysical = productType === "fisico" || productType === "physical";
                  const canSendTracking = isPhysical && (order.payment_status === "paid" || orderStatus === "shipped");

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border last:border-b-0 hover:bg-secondary/30"
                    >
                      <td className="px-4 py-4 text-sm text-muted-foreground font-mono">
                        #{order.id.slice(0, 7)}
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground font-medium">
                        {order.product_name || order.checkout_name || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${type.bg} ${type.text}`}>
                          {type.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">
                        {order.customer_name || "Nao informado"}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {order.shipping_city && order.shipping_state ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.shipping_city}/{order.shipping_state}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {order.tracking_code || (
                          !isPhysical ? "Automatica" : "—"
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {canSendTracking && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary"
                              onClick={() => {
                                setTrackingModal(order);
                                setTrackingCode(order.tracking_code || "");
                              }}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDetailsModal(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Detalhes do Pedido</h2>
              <button
                onClick={() => setDetailsModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">ID do Pedido</p>
                <p className="font-mono text-foreground">#{detailsModal.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produto</p>
                <p className="text-foreground">{detailsModal.product_name || detailsModal.checkout_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comprador</p>
                <p className="text-foreground">{detailsModal.customer_name || "Nao informado"}</p>
                <p className="text-sm text-muted-foreground">{detailsModal.customer_email}</p>
                {detailsModal.customer_phone && (
                  <p className="text-sm text-muted-foreground">{detailsModal.customer_phone}</p>
                )}
              </div>
              {detailsModal.shipping_city && (
                <div>
                  <p className="text-sm text-muted-foreground">Localizacao</p>
                  <p className="text-foreground">
                    {detailsModal.shipping_city}/{detailsModal.shipping_state}
                  </p>
                  {detailsModal.shipping_address && (
                    <p className="text-sm text-muted-foreground">{detailsModal.shipping_address}</p>
                  )}
                  {detailsModal.shipping_zip && (
                    <p className="text-sm text-muted-foreground">CEP: {detailsModal.shipping_zip}</p>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(detailsModal.total)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data do Pedido</p>
                <p className="text-foreground">
                  {new Date(detailsModal.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-border">
              <Button
                onClick={() => setDetailsModal(null)}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Fechar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tracking Modal */}
      {trackingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl w-full max-w-md"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Enviar Rastreio</h2>
              <button
                onClick={() => setTrackingModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Produto</p>
                <p className="text-foreground">{trackingModal.product_name || trackingModal.checkout_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comprador</p>
                <p className="text-foreground">{trackingModal.customer_name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Codigo de Rastreio</Label>
                <Input
                  placeholder="Ex: BR123456789BR"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setTrackingModal(null)}
                className="flex-1 border-border"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendTracking}
                disabled={saving || !trackingCode}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
