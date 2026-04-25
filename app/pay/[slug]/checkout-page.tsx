"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Minus,
  Plus,
  CreditCard,
  Tag,
  CheckCircle,
  Loader2,
  Lock,
  Clock,
  Package,
  Shield,
  Zap,
  Copy,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  banner_url: string | null;
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
  require_name?: boolean;
  require_email?: boolean;
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
  const primaryColor = checkout.primary_color || "#f97316";
  const bgColor = checkout.bg_color || "#0a0a0a";
  const textColor = checkout.text_color || "#ffffff";
  const secondaryColor = checkout.secondary_color || "#1a1a1a";
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"products" | "info" | "payment" | "pix" | "success">("products");
  const [pixData, setPixData] = useState<{ qrCode?: string; copyPaste?: string } | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [timeLeft, setTimeLeft] = useState((checkout.timer_minutes || 15) * 60);
  const [copied, setCopied] = useState(false);

  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    city: "",
    state: "",
    cep: "",
  });

  const products = checkout.products || [];
  const hasProducts = products.length > 0;

  // Auto add single product to cart
  useEffect(() => {
    if (products.length === 1 && cart.length === 0) {
      setCart([{ product: products[0], quantity: 1 }]);
    }
  }, [products]);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const getProductPrice = (product: Product) => {
    return product.custom_price || product.price;
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

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + getProductPrice(item.product) * item.quantity,
    0
  );
  const total = subtotal - couponDiscount;

  const validateCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);

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

      const data = await res.json();

      if (res.ok && data.valid) {
        setCouponDiscount(data.discount);
        setCouponApplied(couponCode);
      } else {
        alert(data.error || "Cupom invalido");
      }
    } catch {
      alert("Erro ao validar cupom");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSubmitOrder = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkout_id: checkout.id,
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: getProductPrice(item.product),
          })),
          customer: customerInfo,
          coupon_code: couponApplied,
          subtotal,
          discount: couponDiscount,
          total,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.pix && data.pix.qrCode) {
          setPixData({
            qrCode: data.pix.qrCode,
            copyPaste: data.pix.copyPaste || data.pix.qrCode,
          });
          setStep("pix");
        } else {
          setStep("success");
        }
      } else {
        alert(data.error || "Erro ao criar pedido");
      }
    } catch {
      alert("Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canProceedToInfo = cart.length > 0;
  const canProceedToPayment = 
    customerInfo.email && 
    (checkout.require_name !== true || customerInfo.name) &&
    (checkout.require_phone !== true || customerInfo.phone) &&
    (checkout.require_cpf !== true || customerInfo.cpf);

  // PIX Screen
  if (step === "pix" && pixData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-0 overflow-hidden" style={{ backgroundColor: secondaryColor }}>
            <div className="p-6 text-center" style={{ backgroundColor: primaryColor }}>
              <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Pagamento PIX</h1>
              <p className="text-white/80 text-sm">Escaneie o QR Code ou copie o codigo</p>
            </div>
            
            <CardContent className="p-6">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixData.copyPaste || '')}`}
                  alt="QR Code PIX"
                  className="w-44 h-44"
                />
              </div>
              
              {/* Copy Code */}
              <div className="mb-6">
                <Label className="text-sm mb-2 block" style={{ color: textColor + "99" }}>
                  Codigo PIX Copia e Cola
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={pixData.copyPaste || ''}
                    readOnly
                    className="text-xs"
                    style={{ backgroundColor: bgColor, color: textColor, borderColor: primaryColor + "40" }}
                  />
                  <Button
                    onClick={copyPixCode}
                    style={{ backgroundColor: primaryColor }}
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Total */}
              <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: primaryColor + "15" }}>
                <p className="text-sm mb-1" style={{ color: textColor + "99" }}>Valor a pagar:</p>
                <p className="text-3xl font-bold" style={{ color: primaryColor }}>{formatCurrency(total)}</p>
              </div>
              
              <Button
                className="w-full"
                onClick={() => setStep("success")}
                style={{ backgroundColor: primaryColor }}
              >
                Ja realizei o pagamento
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Success Screen
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: "#22c55e20" }}>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: textColor }}>
            Pedido Confirmado!
          </h1>
          <p className="mb-6" style={{ color: textColor + "99" }}>
            {checkout.success_message || "Obrigado pela sua compra! Voce recebera um email com os detalhes."}
          </p>
          <div className="p-4 rounded-xl" style={{ backgroundColor: secondaryColor }}>
            <p className="text-sm" style={{ color: textColor + "99" }}>Total pago:</p>
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>{formatCurrency(total)}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Empty checkout (no products configured)
  if (!hasProducts) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
        {/* Header */}
        <header className="p-4 border-b" style={{ borderColor: primaryColor + "20" }}>
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            {checkout.logo_url ? (
              <img src={checkout.logo_url} alt={checkout.name} className="h-10 w-auto" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-bold text-lg">{checkout.name}</span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-8">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: primaryColor + "20" }}>
              <Package className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Checkout em Configuracao</h1>
            <p style={{ color: textColor + "99" }}>
              Este checkout ainda nao possui produtos configurados.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Timer */}
      {checkout.show_timer && timeLeft > 0 && (
        <div className="sticky top-0 z-50 py-2 px-4 text-center text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>
          <Clock className="w-4 h-4 inline mr-2" />
          Oferta expira em: {formatTime(timeLeft)}
        </div>
      )}

      {/* Header */}
      <header className="p-4 border-b" style={{ borderColor: primaryColor + "20" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {checkout.logo_url ? (
              <img src={checkout.logo_url} alt={checkout.name} className="h-10 w-auto" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-bold text-lg">{checkout.name}</span>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: primaryColor + "20" }}>
              <ShoppingCart className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-sm font-medium">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
            </div>
          )}
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          {["products", "info", "payment"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                style={{
                  backgroundColor: step === s || ["products", "info", "payment"].indexOf(step) > i ? primaryColor : secondaryColor,
                  color: step === s || ["products", "info", "payment"].indexOf(step) > i ? "#fff" : textColor + "60",
                }}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div className="w-8 h-0.5" style={{ backgroundColor: ["products", "info", "payment"].indexOf(step) > i ? primaryColor : secondaryColor }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8 mt-2 text-xs" style={{ color: textColor + "80" }}>
          <span>Produto</span>
          <span>Dados</span>
          <span>Pagamento</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pb-32">
        {/* Headline */}
        {checkout.headline && step === "products" && (
          <div className="text-center py-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{checkout.headline}</h1>
            {checkout.subheadline && (
              <p style={{ color: textColor + "99" }}>{checkout.subheadline}</p>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {products.map((product) => {
                  const inCart = cart.find((item) => item.product.id === product.id);
                  return (
                    <Card
                      key={product.id}
                      className="overflow-hidden border transition-all"
                      style={{ 
                        backgroundColor: secondaryColor,
                        borderColor: inCart ? primaryColor : "transparent",
                      }}
                    >
                      {/* Product Image */}
                      {(product.image_url || product.banner_url) && (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={product.banner_url || product.image_url || ""}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          {product.is_digital && (
                            <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Digital
                            </div>
                          )}
                          {product.compare_price && product.compare_price > getProductPrice(product) && (
                            <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                              -{Math.round((1 - getProductPrice(product) / product.compare_price) * 100)}%
                            </div>
                          )}
                        </div>
                      )}
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm mb-4 line-clamp-2" style={{ color: textColor + "99" }}>
                            {product.description}
                          </p>
                        )}
                        
                        <div className="flex items-end justify-between">
                          <div>
                            {product.compare_price && product.compare_price > getProductPrice(product) && (
                              <p className="text-sm line-through" style={{ color: textColor + "50" }}>
                                {formatCurrency(product.compare_price)}
                              </p>
                            )}
                            <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                              {formatCurrency(getProductPrice(product))}
                            </p>
                          </div>
                          
                          {inCart ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(product.id, inCart.quantity - 1)}
                                style={{ borderColor: primaryColor, color: primaryColor }}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{inCart.quantity}</span>
                              <Button
                                size="sm"
                                onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
                                style={{ backgroundColor: primaryColor }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => addToCart(product)}
                              style={{ backgroundColor: primaryColor }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                          )}
                        </div>
                        
                        {checkout.show_stock && product.stock > 0 && product.stock < 10 && (
                          <p className="text-xs mt-3 flex items-center gap-1 text-yellow-500">
                            <AlertCircle className="w-3 h-3" />
                            Apenas {product.stock} em estoque!
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <Card className="border-0 mb-4" style={{ backgroundColor: secondaryColor }}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" style={{ color: primaryColor }} />
                      Resumo do Pedido
                    </h3>
                    
                    <div className="space-y-3 mb-4">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm" style={{ color: textColor + "80" }}>
                              {item.quantity}x {formatCurrency(getProductPrice(item.product))}
                            </p>
                          </div>
                          <p className="font-semibold" style={{ color: primaryColor }}>
                            {formatCurrency(getProductPrice(item.product) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Coupon */}
                    <div className="flex gap-2 mb-4">
                      <Input
                        placeholder="Cupom de desconto"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!couponApplied}
                        className="flex-1"
                        style={{ backgroundColor: bgColor, borderColor: primaryColor + "40" }}
                      />
                      <Button
                        onClick={validateCoupon}
                        disabled={validatingCoupon || !!couponApplied}
                        variant="outline"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        {validatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    {couponApplied && (
                      <div className="flex items-center gap-2 mb-4 p-2 rounded-lg" style={{ backgroundColor: "#22c55e20" }}>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500">Cupom {couponApplied} aplicado!</span>
                      </div>
                    )}
                    
                    {/* Total */}
                    <div className="border-t pt-4" style={{ borderColor: primaryColor + "20" }}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Total:</span>
                        <div className="text-right">
                          {couponDiscount > 0 && (
                            <p className="text-sm line-through" style={{ color: textColor + "60" }}>
                              {formatCurrency(subtotal)}
                            </p>
                          )}
                          <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                            {formatCurrency(total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-0" style={{ backgroundColor: secondaryColor }}>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <User className="w-5 h-5" style={{ color: primaryColor }} />
                    Seus Dados
                  </h2>
                  
                  <div className="space-y-4">
                    {checkout.require_name !== false && (
                      <div>
                        <Label className="mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" style={{ color: primaryColor }} />
                          Nome Completo *
                        </Label>
                        <Input
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          placeholder="Seu nome completo"
                          style={{ backgroundColor: bgColor, borderColor: primaryColor + "40" }}
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label className="mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                        Email *
                      </Label>
                      <Input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        placeholder="seu@email.com"
                        style={{ backgroundColor: bgColor, borderColor: primaryColor + "40" }}
                      />
                    </div>
                    
                    {checkout.require_phone && (
                      <div>
                        <Label className="mb-2 flex items-center gap-2">
                          <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                          Telefone *
                        </Label>
                        <Input
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                          style={{ backgroundColor: bgColor, borderColor: primaryColor + "40" }}
                        />
                      </div>
                    )}
                    
                    {checkout.require_cpf && (
                      <div>
                        <Label className="mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                          CPF *
                        </Label>
                        <Input
                          value={customerInfo.cpf}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          style={{ backgroundColor: bgColor, borderColor: primaryColor + "40" }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Order Summary */}
              <Card className="border-0 mt-4" style={{ backgroundColor: secondaryColor }}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span>Total do pedido:</span>
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-0" style={{ backgroundColor: secondaryColor }}>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                    Forma de Pagamento
                  </h2>
                  
                  {/* PIX Option */}
                  <button
                    className="w-full p-4 rounded-xl border-2 flex items-center gap-4 mb-4 transition-colors"
                    style={{ 
                      backgroundColor: bgColor, 
                      borderColor: primaryColor,
                    }}
                    onClick={handleSubmitOrder}
                    disabled={loading}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor + "20" }}>
                      <Zap className="w-6 h-6" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">PIX</p>
                      <p className="text-sm" style={{ color: textColor + "80" }}>Aprovacao instantanea</p>
                    </div>
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
                    ) : (
                      <ChevronRight className="w-5 h-5" style={{ color: primaryColor }} />
                    )}
                  </button>
                  
                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t" style={{ borderColor: primaryColor + "20" }}>
                    <div className="flex items-center gap-1 text-xs" style={{ color: textColor + "60" }}>
                      <Lock className="w-3 h-3" />
                      Pagamento Seguro
                    </div>
                    <div className="flex items-center gap-1 text-xs" style={{ color: textColor + "60" }}>
                      <Shield className="w-3 h-3" />
                      Dados Protegidos
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Order Summary */}
              <Card className="border-0 mt-4" style={{ backgroundColor: secondaryColor }}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Resumo</h3>
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm mb-2">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span>{formatCurrency(getProductPrice(item.product) * item.quantity)}</span>
                    </div>
                  ))}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm mb-2 text-green-500">
                      <span>Desconto</span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: primaryColor + "20" }}>
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Bar */}
      {step === "products" || step === "info" || step === "payment" ? (
        cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t" style={{ backgroundColor: bgColor, borderColor: primaryColor + "20" }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {step !== "products" && (
              <Button
                variant="outline"
                onClick={() => setStep(step === "payment" ? "info" : "products")}
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Voltar
              </Button>
            )}
            <div className={step === "products" ? "w-full" : ""}>
              <Button
                className="w-full md:w-auto md:min-w-[200px]"
                onClick={() => {
                  if (step === "products") setStep("info");
                  else if (step === "info") setStep("payment");
                }}
                disabled={
                  (step === "products" && !canProceedToInfo) ||
                  (step === "info" && !canProceedToPayment)
                }
                style={{ backgroundColor: primaryColor }}
              >
                {step === "products" && (
                  <>
                    Continuar
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
                {step === "info" && (
                  <>
                    Ir para Pagamento
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        )
      ) : null}
    </div>
  );
}
