"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Tag,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Percent,
  DollarSign,
  Calendar,
  Loader2,
  Copy,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  status: string;
  product_ids?: string[];
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "fixed",
    discount_value: "",
    valid_until: "",
    selectedProducts: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const [couponsRes, productsRes] = await Promise.all([
        fetch("/api/checkout/coupons", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/checkout/products", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (couponsRes.ok) {
        const data = await couponsRes.json();
        setCoupons(data.coupons || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      discount_type: "fixed",
      discount_value: "",
      valid_until: "",
      selectedProducts: [],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      valid_until: coupon.valid_until ? coupon.valid_until.slice(0, 16) : "",
      selectedProducts: coupon.product_ids || [],
    });
    setDialogOpen(true);
  };

  const toggleProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter((id) => id !== productId)
        : [...prev.selectedProducts, productId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.discount_value) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token");
      const url = editingCoupon
        ? `/api/checkout/coupons/${editingCoupon.id}`
        : "/api/checkout/coupons";
      const method = editingCoupon ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value.replace(",", ".")),
          valid_until: formData.valid_until || null,
          product_ids: formData.selectedProducts.length > 0 ? formData.selectedProducts : null,
        }),
      });

      if (res.ok) {
        await loadData();
        setDialogOpen(false);
      }
    } catch (err) {
      console.error("Error saving coupon:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

    try {
      const token = localStorage.getItem("auth-token");
      await fetch(`/api/checkout/coupons/${couponId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadData();
    } catch (err) {
      console.error("Error deleting coupon:", err);
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cupons</h1>
            <p className="text-muted-foreground">Gerencie seus cupons de desconto</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Novo Cupom
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cupons por codigo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredCoupons.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {search ? "Nenhum cupom encontrado" : "Nenhum cupom cadastrado"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {search
                ? "Tente buscar com outros termos"
                : "Crie cupons de desconto para suas vendas"}
            </p>
            {!search && (
              <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Criar Cupom
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon, index) => (
            <motion.div
              key={coupon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground font-mono">
                          {coupon.code}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            coupon.status === "active"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {coupon.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(coupon)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Codigo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(coupon.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="text-2xl font-bold text-primary mb-2">
                    {coupon.discount_type === "percentage" ? (
                      <span className="flex items-center gap-1">
                        <Percent className="w-5 h-5" />
                        {coupon.discount_value}% OFF
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        {formatCurrency(coupon.discount_value)} OFF
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      Usos: {coupon.uses_count}
                      {coupon.max_uses ? ` / ${coupon.max_uses}` : " (ilimitado)"}
                    </p>
                    {coupon.valid_until && (
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Expira: {new Date(coupon.valid_until).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Preencha as informacoes para {editingCoupon ? "editar o" : "criar um novo"} cupom.
                </p>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Codigo */}
              <div className="space-y-2">
                <Label className="text-foreground">Codigo *</Label>
                <Input
                  placeholder="DESCONTO10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-secondary border-primary focus:ring-primary uppercase font-mono"
                />
              </div>

              {/* Tipo e Desconto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Tipo *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Desconto ({formData.discount_type === "percentage" ? "%" : "R$"}) *
                  </Label>
                  <Input
                    placeholder={formData.discount_type === "percentage" ? "10" : "50.00"}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              {/* Produtos */}
              <div className="space-y-2">
                <Label className="text-foreground">Produtos (opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione produtos especificos ou deixe em branco para aplicar a qualquer produto
                </p>
                {products.length > 0 ? (
                  <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        className="flex items-center gap-3 p-3 hover:bg-secondary cursor-pointer border-b border-border last:border-b-0"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            formData.selectedProducts.includes(product.id)
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {formData.selectedProducts.includes(product.id) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground p-3 bg-secondary rounded-lg">
                    Nenhum produto cadastrado
                  </p>
                )}
              </div>

              {/* Data de Expiracao */}
              <div className="space-y-2">
                <Label className="text-foreground">Data de Expiracao (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-border"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || !formData.code || !formData.discount_value}
                className="bg-primary hover:bg-primary/90"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
