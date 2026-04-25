"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Package,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
  X,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  banner_url?: string | null;
  sku: string | null;
  stock: number;
  is_digital: boolean;
  product_type?: string;
  status: string;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    banner_url: "",
    product_type: "",
    sku: "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetch("/api/checkout/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      image_url: "",
      banner_url: "",
      product_type: "",
      sku: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      image_url: product.image_url || "",
      banner_url: product.banner_url || "",
      product_type: product.product_type || (product.is_digital ? "digital" : "fisico"),
      sku: product.sku || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.image_url) {
      alert("Nome, preco e imagem sao obrigatorios");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token");
      const url = editingProduct
        ? `/api/checkout/products/${editingProduct.id}`
        : "/api/checkout/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price.replace(",", ".")),
          image_url: formData.image_url || null,
          banner_url: formData.banner_url || null,
          sku: formData.sku || null,
          is_digital: formData.product_type === "digital",
          product_type: formData.product_type,
          stock: -1,
        }),
      });

      if (res.ok) {
        await loadProducts();
        setDialogOpen(false);
      }
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const token = localStorage.getItem("auth-token");
      await fetch(`/api/checkout/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
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
          <Package className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground">Gerencie seus produtos para checkout</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {search
                ? "Tente buscar com outros termos"
                : "Comece adicionando seu primeiro produto"}
            </p>
            {!search && (
              <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Criar Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-colors">
                {/* Product Image */}
                <div className="aspect-square bg-secondary relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {product.is_digital || product.product_type === "digital" ? (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded">
                      Digital
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 text-white text-xs font-medium rounded">
                      Fisico
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {product.name}
                      </h3>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(product)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(product.price)}
                    </span>
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
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Preencha as informacoes para {editingProduct ? "editar o" : "criar um novo"} produto.
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
              {/* Nome */}
              <div className="space-y-2">
                <Label className="text-foreground">Nome *</Label>
                <Input
                  placeholder="Nome do produto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Link da Imagem */}
              <div className="space-y-2">
<Label className="text-foreground">Link da Imagem *</Label>
  <Input
  placeholder="https://exemplo.com/imagem.jpg"
  value={formData.image_url}
  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
  className="bg-secondary border-border"
  required
  />
              </div>

              {/* Link do Banner */}
              <div className="space-y-2">
                <Label className="text-foreground">Link do Banner</Label>
                <Input
                  placeholder="https://exemplo.com/banner.jpg"
                  value={formData.banner_url}
                  onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Preco */}
              <div className="space-y-2">
                <Label className="text-foreground">Preco (BRL) *</Label>
                <Input
                  placeholder="R$ 0,00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Descricao */}
              <div className="space-y-2">
                <Label className="text-foreground">Descricao *</Label>
                <Textarea
                  placeholder="Descricao do produto (suporta HTML)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="bg-secondary border-border resize-none"
                />
              </div>

              {/* Tipo de Produto */}
              <div className="space-y-2">
                <Label className="text-foreground">Tipo de Produto *</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="fisico">Fisico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <Label className="text-foreground">SKU (opcional)</Label>
                <Input
                  placeholder="Codigo SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
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
                disabled={saving || !formData.name || !formData.price}
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
