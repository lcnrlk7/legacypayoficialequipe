"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Loader2,
  Palette,
  Settings,
  Package,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface CheckoutProduct {
  product_id: string;
  custom_price: number | null;
  sort_order: number;
  product?: Product;
}

interface Checkout {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  bg_color: string;
  pix_enabled: boolean;
  card_enabled: boolean;
  show_timer: boolean;
  timer_minutes: number;
  show_stock: boolean;
  require_phone: boolean;
  require_cpf: boolean;
  headline: string | null;
  subheadline: string | null;
  cta_text: string;
  success_message: string;
  facebook_pixel: string | null;
  google_analytics: string | null;
  status: string;
}

export default function EditCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [checkoutProducts, setCheckoutProducts] = useState<CheckoutProduct[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      
      // Load checkout
      const checkoutRes = await fetch(`/api/checkout/stores/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkoutRes.ok) {
        const data = await checkoutRes.json();
        setCheckout(data.checkout);
      }

      // Load user's products
      const productsRes = await fetch("/api/checkout/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }

      // Load checkout products
      const cpRes = await fetch(`/api/checkout/stores/${id}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cpRes.ok) {
        const data = await cpRes.json();
        setCheckoutProducts(data.products || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!checkout) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token");
      
      // Save checkout settings
      await fetch(`/api/checkout/stores/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(checkout),
      });

      // Save checkout products
      await fetch(`/api/checkout/stores/${id}/products`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: checkoutProducts }),
      });

      alert("Checkout salvo com sucesso!");
    } catch (err) {
      console.error("Error saving checkout:", err);
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const addProduct = (productId: string) => {
    if (checkoutProducts.find((cp) => cp.product_id === productId)) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCheckoutProducts([
      ...checkoutProducts,
      {
        product_id: productId,
        custom_price: null,
        sort_order: checkoutProducts.length,
        product,
      },
    ]);
  };

  const removeProduct = (productId: string) => {
    setCheckoutProducts(checkoutProducts.filter((cp) => cp.product_id !== productId));
  };

  const updateProductPrice = (productId: string, price: number | null) => {
    setCheckoutProducts(
      checkoutProducts.map((cp) =>
        cp.product_id === productId ? { ...cp, custom_price: price } : cp
      )
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Checkout nao encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/checkout">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar Checkout</h1>
            <p className="text-muted-foreground">{checkout.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href={`/pay/${checkout.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </a>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="w-4 h-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Configuracoes
          </TabsTrigger>
          <TabsTrigger value="tracking" className="gap-2">
            <Code className="w-4 h-4" />
            Rastreamento
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos no Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              {checkoutProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum produto adicionado. Adicione produtos abaixo.
                </p>
              ) : (
                <div className="space-y-3">
                  {checkoutProducts.map((cp, index) => {
                    const product = cp.product || products.find((p) => p.id === cp.product_id);
                    if (!product) return null;

                    return (
                      <div
                        key={cp.product_id}
                        className="flex items-center gap-4 p-4 bg-secondary rounded-lg"
                      >
                        <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Preco original: {formatCurrency(product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <Label className="text-xs">Preco customizado</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder={product.price.toString()}
                              value={cp.custom_price || ""}
                              onChange={(e) =>
                                updateProductPrice(
                                  cp.product_id,
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                              className="w-32"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProduct(cp.product_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Products */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">Adicionar Produtos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {products
                    .filter((p) => !checkoutProducts.find((cp) => cp.product_id === p.id))
                    .map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => addProduct(product.id)}
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {product.name}
                          </p>
                          <p className="text-sm text-primary">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ))}
                </div>
                {products.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Voce ainda nao tem produtos.{" "}
                    <Link href="/dashboard/checkout/products" className="text-primary hover:underline">
                      Criar produto
                    </Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Cor Principal</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={checkout.primary_color}
                      onChange={(e) =>
                        setCheckout({ ...checkout, primary_color: e.target.value })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={checkout.primary_color}
                      onChange={(e) =>
                        setCheckout({ ...checkout, primary_color: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor Secundaria</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={checkout.secondary_color}
                      onChange={(e) =>
                        setCheckout({ ...checkout, secondary_color: e.target.value })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={checkout.secondary_color}
                      onChange={(e) =>
                        setCheckout({ ...checkout, secondary_color: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor do Texto</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={checkout.text_color}
                      onChange={(e) =>
                        setCheckout({ ...checkout, text_color: e.target.value })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={checkout.text_color}
                      onChange={(e) =>
                        setCheckout({ ...checkout, text_color: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={checkout.bg_color}
                      onChange={(e) =>
                        setCheckout({ ...checkout, bg_color: e.target.value })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={checkout.bg_color}
                      onChange={(e) =>
                        setCheckout({ ...checkout, bg_color: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Textos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titulo Principal</Label>
                <Input
                  placeholder="Ex: Oferta Especial!"
                  value={checkout.headline || ""}
                  onChange={(e) => setCheckout({ ...checkout, headline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitulo</Label>
                <Input
                  placeholder="Ex: Aproveite enquanto dura"
                  value={checkout.subheadline || ""}
                  onChange={(e) => setCheckout({ ...checkout, subheadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Texto do Botao</Label>
                <Input
                  placeholder="Comprar Agora"
                  value={checkout.cta_text}
                  onChange={(e) => setCheckout({ ...checkout, cta_text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mensagem de Sucesso</Label>
                <Textarea
                  placeholder="Obrigado pela sua compra!"
                  value={checkout.success_message}
                  onChange={(e) => setCheckout({ ...checkout, success_message: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Logo</Label>
                <Input
                  placeholder="https://..."
                  value={checkout.logo_url || ""}
                  onChange={(e) => setCheckout({ ...checkout, logo_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL do Banner</Label>
                <Input
                  placeholder="https://..."
                  value={checkout.banner_url || ""}
                  onChange={(e) => setCheckout({ ...checkout, banner_url: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes Basicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Checkout</Label>
                <Input
                  value={checkout.name}
                  onChange={(e) => setCheckout({ ...checkout, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL (Slug)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/pay/</span>
                  <Input
                    value={checkout.slug}
                    onChange={(e) => setCheckout({ ...checkout, slug: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descricao</Label>
                <Textarea
                  value={checkout.description || ""}
                  onChange={(e) => setCheckout({ ...checkout, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campos Obrigatorios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Telefone Obrigatorio</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir telefone do cliente
                  </p>
                </div>
                <Switch
                  checked={checkout.require_phone}
                  onCheckedChange={(v) => setCheckout({ ...checkout, require_phone: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>CPF Obrigatorio</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir CPF do cliente
                  </p>
                </div>
                <Switch
                  checked={checkout.require_cpf}
                  onCheckedChange={(v) => setCheckout({ ...checkout, require_cpf: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recursos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Timer de Urgencia</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar contador regressivo
                  </p>
                </div>
                <Switch
                  checked={checkout.show_timer}
                  onCheckedChange={(v) => setCheckout({ ...checkout, show_timer: v })}
                />
              </div>
              {checkout.show_timer && (
                <div className="space-y-2 ml-4">
                  <Label>Minutos do Timer</Label>
                  <Input
                    type="number"
                    value={checkout.timer_minutes}
                    onChange={(e) =>
                      setCheckout({ ...checkout, timer_minutes: parseInt(e.target.value) || 15 })
                    }
                    className="w-32"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostrar Estoque</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir quantidade em estoque
                  </p>
                </div>
                <Switch
                  checked={checkout.show_stock}
                  onCheckedChange={(v) => setCheckout({ ...checkout, show_stock: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pixels e Rastreamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook Pixel ID</Label>
                <Input
                  placeholder="123456789012345"
                  value={checkout.facebook_pixel || ""}
                  onChange={(e) => setCheckout({ ...checkout, facebook_pixel: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Google Analytics ID</Label>
                <Input
                  placeholder="G-XXXXXXXXXX"
                  value={checkout.google_analytics || ""}
                  onChange={(e) => setCheckout({ ...checkout, google_analytics: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
