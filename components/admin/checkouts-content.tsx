"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Receipt,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ExternalLink,
  Search,
  Filter,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Checkout {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  status: string;
  primary_color: string;
  created_at: string;
  owner_email: string;
  owner_name: string | null;
  products_count: number;
  orders_count: number;
  total_revenue: number;
}

interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  status: string;
  created_at: string;
  owner_email: string;
  owner_name: string | null;
}

interface Order {
  id: string;
  checkout_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
  checkout_name: string;
  checkout_slug: string;
  seller_email: string;
}

interface Stats {
  total_checkouts: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  paid_orders: number;
  pending_orders: number;
}

interface AdminCheckoutsContentProps {
  checkouts: Checkout[];
  products: Product[];
  orders: Order[];
  stats: Stats;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
    case "completed":
    case "active":
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {status === "paid" ? "Pago" : status === "active" ? "Ativo" : "Concluido"}
        </span>
      );
    case "pending":
    case "processing":
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pendente
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-500 rounded-full flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          {status}
        </span>
      );
  }
};

export function AdminCheckoutsContent({
  checkouts,
  products,
  orders,
  stats,
}: AdminCheckoutsContentProps) {
  const [activeTab, setActiveTab] = useState<"checkouts" | "products" | "orders">("checkouts");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredCheckouts = checkouts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.owner_email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.owner_email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      o.checkout_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pt-16 lg:pt-0">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Checkouts
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerenciar checkouts, produtos e vendas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_checkouts}</p>
          <p className="text-sm text-muted-foreground mt-1">Checkouts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_products}</p>
          <p className="text-sm text-muted-foreground mt-1">Produtos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total_orders}</p>
          <p className="text-sm text-muted-foreground mt-1">Pedidos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(Number(stats.total_revenue) || 0)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Faturamento</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        <Button
          variant={activeTab === "checkouts" ? "default" : "ghost"}
          onClick={() => setActiveTab("checkouts")}
          className="gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Checkouts ({checkouts.length})
        </Button>
        <Button
          variant={activeTab === "products" ? "default" : "ghost"}
          onClick={() => setActiveTab("products")}
          className="gap-2"
        >
          <Package className="w-4 h-4" />
          Produtos ({products.length})
        </Button>
        <Button
          variant={activeTab === "orders" ? "default" : "ghost"}
          onClick={() => setActiveTab("orders")}
          className="gap-2"
        >
          <Receipt className="w-4 h-4" />
          Vendas ({orders.length})
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* Checkouts Tab */}
      {activeTab === "checkouts" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Checkout</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Proprietario</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Produtos</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Vendas</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Faturamento</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Criado</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheckouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Nenhum checkout encontrado
                    </td>
                  </tr>
                ) : (
                  filteredCheckouts.map((checkout) => (
                    <tr key={checkout.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: checkout.primary_color + "20" }}
                          >
                            <ShoppingCart
                              className="w-5 h-5"
                              style={{ color: checkout.primary_color }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{checkout.name}</p>
                            <p className="text-xs text-muted-foreground">/{checkout.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-foreground">{checkout.owner_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{checkout.owner_email}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-foreground">{checkout.products_count}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-foreground">{checkout.orders_count}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-green-500">
                          {formatCurrency(Number(checkout.total_revenue) || 0)}
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(checkout.status)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(checkout.created_at)}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/pay/${checkout.slug}`, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredProducts.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground bg-card border border-border rounded-2xl">
              Nenhum produto encontrado
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    {getStatusBadge(product.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {product.description || "Sem descricao"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(product.price)}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{product.owner_email}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Checkout</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Vendedor</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Nenhuma venda encontrada
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="p-4">
                        <p className="font-medium text-foreground">{order.customer_name || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-foreground">{order.checkout_name}</p>
                        <p className="text-xs text-muted-foreground">/{order.checkout_slug}</p>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {order.seller_email}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-green-500">
                          {formatCurrency(order.total)}
                        </span>
                      </td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium text-foreground">{selectedOrder.customer_phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Checkout</p>
                  <p className="font-medium text-foreground">{selectedOrder.checkout_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendedor</p>
                  <p className="font-medium text-foreground">{selectedOrder.seller_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium text-foreground">{formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-green-500">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
                <div className="flex justify-end mt-2">
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
