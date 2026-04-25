"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus,
  ShoppingCart,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  ExternalLink,
  Loader2,
  BarChart3,
  DollarSign,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Checkout {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  status: string;
  visits: number;
  created_at: string;
  orders_count?: number;
  revenue?: number;
}

export default function CheckoutsPage() {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCheckout, setEditingCheckout] = useState<Checkout | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    primary_color: "#f97316",
  });

  useEffect(() => {
    loadCheckouts();
  }, []);

  const loadCheckouts = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetch("/api/checkout/stores", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCheckouts(data.checkouts || []);
      }
    } catch (err) {
      console.error("Error loading checkouts:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const openCreateDialog = () => {
    setEditingCheckout(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      primary_color: "#f97316",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (checkout: Checkout) => {
    setEditingCheckout(checkout);
    setFormData({
      name: checkout.name,
      slug: checkout.slug,
      description: checkout.description || "",
      primary_color: checkout.primary_color,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token");
      const url = editingCheckout
        ? `/api/checkout/stores/${editingCheckout.id}`
        : "/api/checkout/stores";
      const method = editingCheckout ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await loadCheckouts();
        setDialogOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar");
      }
    } catch (err) {
      console.error("Error saving checkout:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (checkoutId: string) => {
    if (!confirm("Tem certeza que deseja excluir este checkout?")) return;

    try {
      const token = localStorage.getItem("auth-token");
      await fetch(`/api/checkout/stores/${checkoutId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadCheckouts();
    } catch (err) {
      console.error("Error deleting checkout:", err);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/pay/${slug}`;
    navigator.clipboard.writeText(url);
    alert("Link copiado!");
  };

  const filteredCheckouts = checkouts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Checkouts</h1>
          <p className="text-muted-foreground">Crie e gerencie suas paginas de venda</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Checkout
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar checkouts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Checkouts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredCheckouts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {search ? "Nenhum checkout encontrado" : "Nenhum checkout criado"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {search
                ? "Tente buscar com outros termos"
                : "Crie seu primeiro checkout para comecar a vender"}
            </p>
            {!search && (
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Checkout
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCheckouts.map((checkout, index) => (
            <motion.div
              key={checkout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Checkout Info */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: checkout.primary_color + "20" }}
                      >
                        <ShoppingCart
                          className="w-6 h-6"
                          style={{ color: checkout.primary_color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{checkout.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          /pay/{checkout.slug}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">Visitas</span>
                        </div>
                        <p className="font-semibold text-foreground">{checkout.visits || 0}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">Vendas</span>
                        </div>
                        <p className="font-semibold text-foreground">{checkout.orders_count || 0}</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm">Receita</span>
                        </div>
                        <p className="font-semibold text-primary">
                          {formatCurrency(checkout.revenue || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(checkout.slug)}
                        className="gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`/pay/${checkout.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Abrir
                        </a>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/checkout/${checkout.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar Checkout
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/checkout/${checkout.id}/products`}>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Gerenciar Produtos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(checkout.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCheckout ? "Editar Checkout" : "Novo Checkout"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Checkout *</Label>
              <Input
                placeholder="Ex: Loja de Cursos"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: editingCheckout ? formData.slug : generateSlug(e.target.value),
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>URL do Checkout *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/pay/</span>
                <Input
                  placeholder="minha-loja"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                placeholder="Descreva sua pagina de checkout..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor Principal</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-12 h-12 rounded-lg border-0 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !formData.name || !formData.slug}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCheckout ? "Salvar" : "Criar Checkout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
