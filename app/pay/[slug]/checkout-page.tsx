"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Tag,
  CheckCircle,
  Loader2,
  Lock,
  Clock,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  custom_price: number | null;
  is_digital: boolean;
  stock: number;
}

interface Checkout {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  primary_color?: string;
  secondary_color?: string;
  text_color?: string;
  bg_color?: string;
  pix_enabled?: boolean;
  card_enabled?: boolean;
  show_timer?: boolean;
  timer_minutes?: number;
  show_stock?: boolean;
  require_phone?: boolean;
  require_cpf?: boolean;
  headline?: string | null;
  subheadline?: string | null;
  cta_text?: string;
  success_message?: string;
  products?: Product[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

export function CheckoutPage({ checkout }: { checkout: Checkout }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"products" | "info" | "payment" | "success">("products");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState((checkout.timer_minutes || 15) * 60);

  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });

  // Timer countdown
  useEffect(() => {
    if (!checkout.show_timer || step === "success") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checkout.show_timer, step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProductPrice = (product: Product) => {
    return product.custom_price ?? product.price;
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + getProductPrice(item.product) * item.quantity,
    0
  );
  const discount = couponDiscount;
  const total = Math.max(0, subtotal - discount);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const applyCoupon = async () => {
    if (!couponCode) return;

    setLoading(true);
    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          checkout_id: checkout.id,
          subtotal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCouponDiscount(data.discount);
        setCouponApplied(couponCode);
      } else {
        alert("Cupom invalido ou expirado");
      }
    } catch (err) {
      console.error("Error applying coupon:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      alert("Preencha nome e email");
      return;
    }

    if (checkout.require_phone && !customerInfo.phone) {
      alert("Telefone e obrigatorio");
      return;
    }

    if (checkout.require_cpf && !customerInfo.cpf) {
      alert("CPF e obrigatorio");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkout_id: checkout.id,
          seller_id: checkout.user_id,
          customer: customerInfo,
          items: cart.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            product_price: getProductPrice(item.product),
            quantity: item.quantity,
          })),
          subtotal,
          discount,
          total,
          coupon_code: couponApplied,
          payment_method: "pix",
        }),
      });

      if (res.ok) {
        setStep("success");
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao criar pedido");
      }
    } catch (err) {
      console.error("Error creating order:", err);
      alert("Erro ao processar pedido");
    } finally {
      setLoading(false);
    }
  };

  // Custom styles based on checkout settings
  const styles = {
    "--primary": checkout.primary_color,
    "--bg": checkout.bg_color,
    "--text": checkout.text_color,
  } as React.CSSProperties;

  // Success Screen
  if (step === "success") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: checkout.bg_color }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: checkout.primary_color + "20" }}
          >
            <CheckCircle
              className="w-10 h-10"
              style={{ color: checkout.primary_color }}
            />
          </div>
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: checkout.text_color }}
          >
            Pedido Realizado!
          </h1>
          <p style={{ color: checkout.text_color + "99" }}>
            {checkout.success_message}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: checkout.bg_color, color: checkout.text_color }}
    >
      {/* Timer Bar */}
      {checkout.show_timer && timeLeft > 0 && (
        <div
          className="sticky top-0 z-50 py-2 px-4 text-center text-sm font-medium"
          style={{ backgroundColor: checkout.primary_color }}
        >
          <Clock className="w-4 h-4 inline-block mr-2" />
          Oferta expira em: {formatTime(timeLeft)}
        </div>
      )}

      {/* Header */}
      <header className="py-6 px-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {checkout.logo_url ? (
              <img
                src={checkout.logo_url}
                alt={checkout.name}
                className="h-10 w-auto"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: checkout.primary_color }}
              >
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-bold text-lg">{checkout.name}</span>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">{cart.length} item(ns)</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-24">
        {/* Headline */}
        {checkout.headline && (
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold mb-2">{checkout.headline}</h1>
            {checkout.subheadline && (
              <p style={{ color: checkout.text_color + "99" }}>
                {checkout.subheadline}
              </p>
            )}
          </div>
        )}

        {step === "products" && (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {checkout.products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className="overflow-hidden border-0"
                    style={{ backgroundColor: checkout.secondary_color }}
                  >
                    {product.image_url && (
                      <div className="aspect-video relative">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.is_digital && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                            Digital
                          </div>
                        )}
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3
                        className="font-semibold text-lg mb-1"
                        style={{ color: checkout.text_color }}
                      >
                        {product.name}
                      </h3>
                      {product.description && (
                        <p
                          className="text-sm mb-3 line-clamp-2"
                          style={{ color: checkout.text_color + "99" }}
                        >
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <span
                            className="text-2xl font-bold"
                            style={{ color: checkout.primary_color }}
                          >
                            {formatCurrency(getProductPrice(product))}
                          </span>
                          {product.compare_price &&
                            product.compare_price > getProductPrice(product) && (
                              <span
                                className="text-sm ml-2 line-through"
                                style={{ color: checkout.text_color + "66" }}
                              >
                                {formatCurrency(product.compare_price)}
                              </span>
                            )}
                        </div>
                        <Button
                          onClick={() => addToCart(product)}
                          style={{
                            backgroundColor: checkout.primary_color,
                            color: "#fff",
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      {checkout.show_stock && product.stock > 0 && product.stock < 10 && (
                        <p className="text-xs mt-2 text-yellow-500">
                          Apenas {product.stock} em estoque!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <Card
                className="border-0 mb-4"
                style={{ backgroundColor: checkout.secondary_color }}
              >
                <CardContent className="p-4">
                  <h3
                    className="font-semibold mb-4"
                    style={{ color: checkout.text_color }}
                  >
                    Seu Carrinho
                  </h3>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p
                            className="font-medium"
                            style={{ color: checkout.text_color }}
                          >
                            {item.product.name}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: checkout.text_color + "99" }}
                          >
                            {formatCurrency(getProductPrice(item.product))} x{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Cupom de desconto"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                        disabled={!!couponApplied}
                      />
                      <Button
                        variant="outline"
                        onClick={applyCoupon}
                        disabled={loading || !!couponApplied}
                      >
                        {couponApplied ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Tag className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: checkout.text_color + "99" }}>
                        Subtotal
                      </span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-500">
                        <span>Desconto ({couponApplied})</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span style={{ color: checkout.primary_color }}>
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={() => setStep("info")}
                    style={{
                      backgroundColor: checkout.primary_color,
                      color: "#fff",
                    }}
                  >
                    {checkout.cta_text || "Continuar"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {step === "info" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card
              className="border-0"
              style={{ backgroundColor: checkout.secondary_color }}
            >
              <CardContent className="p-6">
                <h3
                  className="font-semibold text-lg mb-4"
                  style={{ color: checkout.text_color }}
                >
                  Seus Dados
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label style={{ color: checkout.text_color }}>Nome Completo *</Label>
                    <Input
                      placeholder="Seu nome"
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, name: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label style={{ color: checkout.text_color }}>Email *</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, email: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  {checkout.require_phone && (
                    <div>
                      <Label style={{ color: checkout.text_color }}>Telefone *</Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, phone: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  )}
                  {checkout.require_cpf && (
                    <div>
                      <Label style={{ color: checkout.text_color }}>CPF *</Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={customerInfo.cpf}
                        onChange={(e) =>
                          setCustomerInfo({ ...customerInfo, cpf: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4
                    className="font-medium mb-3"
                    style={{ color: checkout.text_color }}
                  >
                    Resumo do Pedido
                  </h4>
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex justify-between text-sm mb-1"
                    >
                      <span style={{ color: checkout.text_color + "99" }}>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span>
                        {formatCurrency(getProductPrice(item.product) * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-500 mt-2">
                      <span>Desconto</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t border-white/10">
                    <span>Total</span>
                    <span style={{ color: checkout.primary_color }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep("products")}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    className="flex-1"
                    style={{
                      backgroundColor: checkout.primary_color,
                      color: "#fff",
                    }}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Finalizar Pedido
                      </>
                    )}
                  </Button>
                </div>

                <p
                  className="text-xs text-center mt-4"
                  style={{ color: checkout.text_color + "66" }}
                >
                  <Lock className="w-3 h-3 inline-block mr-1" />
                  Pagamento seguro. Seus dados estao protegidos.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
