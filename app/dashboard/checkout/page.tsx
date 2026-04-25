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
  DollarSign,
  Users,
  X,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
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
import { Switch } from "@/components/ui/switch";

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

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function CheckoutsPage() {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCheckout, setEditingCheckout] = useState<Checkout | null>(null);
  const [saving, setSaving] = useState(false);

  // Sections collapse state
  const [sectionsOpen, setSectionsOpen] = useState({
    cliente: true,
    entregavel: true,
    seo: false,
    contador: false,
    provas: false,
  });

  // Form state - complete form based on config
  const [formData, setFormData] = useState({
    // Basic
    product_id: "",
    order_bumps: [] as string[],
    
    // Customer Info
    require_name: true,
    require_email: true,
    require_phone: false,
    require_cpf: false,
    require_address: false,
    
    // Delivery
    delivery_type: "link",
    delivery_link: "",
    delivery_method: "none",
    
    // Timer
    checkout_timer: "10",
    
    // URLs
    success_url: "",
    cancel_url: "",
    return_url: "",
    
    // Theme
    theme: "dark",
    primary_color: "#f97316",
    
    // Custom Domain
    custom_domain: "",
    
    // SEO
    page_title: "",
    page_description: "",
    share_title: "",
    share_description: "",
    share_image: "",
    favicon: "",
    
    // Counter
    show_counter: false,
    
    // Social Proof
    show_social_proof: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const [checkoutsRes, productsRes] = await Promise.all([
        fetch("/api/checkout/stores", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/checkout/products", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (checkoutsRes.ok) {
        const data = await checkoutsRes.json();
        setCheckouts(data.checkouts || []);
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
    setEditingCheckout(null);
    setFormData({
      product_id: "",
      order_bumps: [],
      require_name: true,
      require_email: true,
      require_phone: false,
      require_cpf: false,
      require_address: false,
      delivery_type: "link",
      delivery_link: "",
      delivery_method: "none",
      checkout_timer: "10",
      success_url: "",
      cancel_url: "",
      return_url: "",
      theme: "dark",
      primary_color: "#f97316",
      custom_domain: "",
      page_title: "",
      page_description: "",
      share_title: "",
      share_description: "",
      share_image: "",
      favicon: "",
      show_counter: false,
      show_social_proof: false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.product_id) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token");
      const url = editingCheckout
        ? `/api/checkout/stores/${editingCheckout.id}`
        : "/api/checkout/stores";
      const method = editingCheckout ? "PUT" : "POST";

      const selectedProduct = products.find(p => p.id === formData.product_id);
      const slug = selectedProduct?.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") + "-" + Date.now().toString(36);

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedProduct?.name || "Checkout",
          slug,
          ...formData,
        }),
      });

      if (res.ok) {
        await loadData();
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
      await loadData();
    } catch (err) {
      console.error("Error deleting checkout:", err);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/pay/${slug}`;
    navigator.clipboard.writeText(url);
  };

  const toggleOrderBump = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      order_bumps: prev.order_bumps.includes(productId)
        ? prev.order_bumps.filter((id) => id !== productId)
        : [...prev.order_bumps, productId],
    }));
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
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

  const availableOrderBumps = products.filter((p) => p.id !== formData.product_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Checkouts</h1>
            <p className="text-muted-foreground">Crie e gerencie suas paginas de venda</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/90">
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
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* Checkouts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredCheckouts.length === 0 ? (
        <Card className="bg-card border-border">
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
              <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/90">
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
              <Card className="bg-card border-border hover:border-primary/50 transition-colors">
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
                        className="gap-1 border-border"
                      >
                        <Copy className="w-4 h-4" />
                        Copiar Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-border"
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

      {/* Create/Edit Modal - Full Form */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {editingCheckout ? "Editar Checkout" : "Novo Checkout"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Preencha as informacoes para {editingCheckout ? "editar o" : "criar um novo"} checkout.
                </p>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Limite de vendas por transacao</p>
                  <p className="text-muted-foreground">
                    Seu limite maximo por venda e de R$ 5.000,00. Produtos com valor acima deste limite nao poderao ser vendidos via checkout.
                  </p>
                </div>
              </div>

              {/* Product Selection */}
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" />
                  Produto *
                </Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order Bumps */}
              <div className="space-y-2">
                <Label className="text-foreground">Order Bumps (Opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.product_id
                    ? "Selecione um ou mais produtos adicionais que serao oferecidos como order bumps durante o checkout."
                    : "Selecione um produto principal primeiro."}
                </p>
                {formData.product_id && availableOrderBumps.length > 0 && (
                  <div className="border border-border rounded-lg max-h-32 overflow-y-auto">
                    {availableOrderBumps.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => toggleOrderBump(product.id)}
                        className="flex items-center gap-3 p-3 hover:bg-secondary cursor-pointer border-b border-border last:border-b-0"
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            formData.order_bumps.includes(product.id)
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {formData.order_bumps.includes(product.id) && (
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
                )}
              </div>

              {/* Customer Information Section */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection("cliente")}
                  className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary"
                >
                  <span className="font-medium text-foreground">Informacoes do Cliente</span>
                  {sectionsOpen.cliente ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {sectionsOpen.cliente && (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Selecione quais informacoes voce deseja solicitar do cliente no checkout.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Nome Completo</p>
                          <p className="text-xs text-muted-foreground">Solicitar nome completo do cliente</p>
                        </div>
                        <Switch
                          checked={formData.require_name}
                          onCheckedChange={(checked) => setFormData({ ...formData, require_name: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Email</p>
                          <p className="text-xs text-muted-foreground">Solicitar endereco de email do cliente</p>
                        </div>
                        <Switch
                          checked={formData.require_email}
                          onCheckedChange={(checked) => setFormData({ ...formData, require_email: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Telefone</p>
                          <p className="text-xs text-muted-foreground">Solicitar numero de telefone do cliente</p>
                        </div>
                        <Switch
                          checked={formData.require_phone}
                          onCheckedChange={(checked) => setFormData({ ...formData, require_phone: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">CPF</p>
                          <p className="text-xs text-muted-foreground">Solicitar CPF do cliente</p>
                        </div>
                        <Switch
                          checked={formData.require_cpf}
                          onCheckedChange={(checked) => setFormData({ ...formData, require_cpf: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">Endereco</p>
                          <p className="text-xs text-muted-foreground">Solicitar endereco completo do cliente (CEP, cidade, estado, rua, etc.)</p>
                        </div>
                        <Switch
                          checked={formData.require_address}
                          onCheckedChange={(checked) => setFormData({ ...formData, require_address: checked })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Section */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection("entregavel")}
                  className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary"
                >
                  <span className="font-medium text-foreground">Entregavel</span>
                  {sectionsOpen.entregavel ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {sectionsOpen.entregavel && (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure o que sera entregue ao comprador apos o pagamento.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-foreground">Tipo de Entrega</Label>
                      <Select
                        value={formData.delivery_type}
                        onValueChange={(value) => setFormData({ ...formData, delivery_type: value })}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="link">Link / Fixo</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Link / Texto Fixo</Label>
                      <Input
                        placeholder="https://exemplo.com/download ou texto fixo"
                        value={formData.delivery_link}
                        onChange={(e) => setFormData({ ...formData, delivery_link: e.target.value })}
                        className="bg-secondary border-border"
                      />
                      <p className="text-xs text-muted-foreground">
                        Este link ou texto sera entregue a todos os compradores apos o pagamento.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Onde entregar ao comprador</Label>
                      <Select
                        value={formData.delivery_method}
                        onValueChange={(value) => setFormData({ ...formData, delivery_method: value })}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum (redirecionar para minha pagina)</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {"Escolha onde o comprador recebera o produto apos o pagamento. \"Nenhum\" caso voce queira redirecionar para uma pagina propria."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Timer */}
              <div className="space-y-2">
                <Label className="text-foreground">Tempo para Finalizar a Compra (minutos)</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={formData.checkout_timer}
                  onChange={(e) => setFormData({ ...formData, checkout_timer: e.target.value })}
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Tempo em minutos que o cliente tera para finalizar a compra apos acessar o checkout. Deixe em branco para usar 10 minutos (padrao). Maximo: 1440 minutos (24 horas).
                </p>
              </div>

              {/* URLs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">URL de Sucesso (Opcional)</Label>
                  <Input
                    placeholder="https://seusite.com/sucesso"
                    value={formData.success_url}
                    onChange={(e) => setFormData({ ...formData, success_url: e.target.value })}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL para redirecionar o cliente quando o pagamento for confirmado com sucesso.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">URL de Cancelamento (Opcional)</Label>
                  <Input
                    placeholder="https://seusite.com/cancelado"
                    value={formData.cancel_url}
                    onChange={(e) => setFormData({ ...formData, cancel_url: e.target.value })}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL para redirecionar o cliente quando o checkout expirar, for cancelado ou quando a transacao falhar.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">URL de Retorno (Opcional)</Label>
                  <Input
                    placeholder="https://seusite.com/produto"
                    value={formData.return_url}
                    onChange={(e) => setFormData({ ...formData, return_url: e.target.value })}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    {"URL para o botao \"Voltar\" na pagina de checkout."}
                  </p>
                </div>
              </div>

              {/* Theme */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Tema do Checkout</Label>
                  <Select
                    value={formData.theme}
                    onValueChange={(value) => setFormData({ ...formData, theme: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="light">Claro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Cor do Checkout</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-10 h-10 rounded border-0 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 bg-secondary border-border"
                    />
</div>
                  </div>
                  
                  {/* Custom Domain */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <Label className="text-foreground">Dominio Personalizado (Opcional)</Label>
                    <Input
                      placeholder="Ex: pay-checkout-pagamentoseguros.online"
                      value={formData.custom_domain}
                      onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value.toLowerCase().trim() })}
                      className="bg-secondary border-border"
                    />
                    <p className="text-xs text-muted-foreground">
                      Configure um dominio personalizado para seu checkout. O dominio deve estar apontando para o Vercel.
                    </p>
                  </div>
                  </div>
                  
                  {/* SEO Section */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection("seo")}
                  className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary"
                >
                  <span className="font-medium text-foreground">Configuracoes de SEO e Compartilhamento</span>
                  {sectionsOpen.seo ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {sectionsOpen.seo && (
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure o titulo, descricao e imagem que aparecerao quando o link do checkout for compartilhado.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-foreground">Titulo da Pagina (Opcional)</Label>
                      <Input
                        placeholder="Checkout | Transacao confiavel"
                        value={formData.page_title}
                        onChange={(e) => setFormData({ ...formData, page_title: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Descricao da Pagina (Opcional)</Label>
                      <Textarea
                        placeholder="Checkout | Transacao confiavel"
                        value={formData.page_description}
                        onChange={(e) => setFormData({ ...formData, page_description: e.target.value })}
                        className="bg-secondary border-border resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Imagem para Compartilhamento (Opcional)</Label>
                      <Input
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={formData.share_image}
                        onChange={(e) => setFormData({ ...formData, share_image: e.target.value })}
                        className="bg-secondary border-border"
                      />
                      <p className="text-xs text-muted-foreground">Recomendado: 1200x630px</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Favicon (Opcional)</Label>
                      <Input
                        placeholder="https://exemplo.com/favicon.ico"
                        value={formData.favicon}
                        onChange={(e) => setFormData({ ...formData, favicon: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Counter Section */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection("contador")}
                  className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary"
                >
                  <span className="font-medium text-foreground">Contador de Pessoas</span>
                  {sectionsOpen.contador ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {sectionsOpen.contador && (
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Exibir contador de pessoas</p>
                        <p className="text-xs text-muted-foreground">
                          Exibe um contador ficticio de pessoas finalizando a compra neste momento no checkout.
                        </p>
                      </div>
                      <Switch
                        checked={formData.show_counter}
                        onCheckedChange={(checked) => setFormData({ ...formData, show_counter: checked })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Social Proof Section */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection("provas")}
                  className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary"
                >
                  <span className="font-medium text-foreground">Provas Sociais</span>
                  {sectionsOpen.provas ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {sectionsOpen.provas && (
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Adicionar provas sociais</p>
                        <p className="text-xs text-muted-foreground">
                          Ative esta opcao para exibir provas sociais no checkout.
                        </p>
                      </div>
                      <Switch
                        checked={formData.show_social_proof}
                        onCheckedChange={(checked) => setFormData({ ...formData, show_social_proof: checked })}
                      />
                    </div>
                  </div>
                )}
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
                disabled={saving || !formData.product_id}
                className="bg-primary hover:bg-primary/90"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
