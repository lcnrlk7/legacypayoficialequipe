-- Checkout System Tables
-- Run this script to create the checkout system tables

-- Products table
CREATE TABLE IF NOT EXISTS checkout_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  compare_price DECIMAL(10, 2), -- Original price for showing discount
  image_url TEXT,
  images TEXT[], -- Array of image URLs
  sku VARCHAR(100),
  stock INTEGER DEFAULT -1, -- -1 = unlimited
  is_digital BOOLEAN DEFAULT false,
  digital_file_url TEXT, -- URL for digital product delivery
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checkouts (stores/landing pages)
CREATE TABLE IF NOT EXISTS checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE, -- URL slug for the checkout
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#f97316', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#1a1a1a',
  text_color VARCHAR(7) DEFAULT '#ffffff',
  bg_color VARCHAR(7) DEFAULT '#0a0a0a',
  
  -- Payment settings
  pix_enabled BOOLEAN DEFAULT true,
  card_enabled BOOLEAN DEFAULT false,
  boleto_enabled BOOLEAN DEFAULT false,
  
  -- Checkout settings
  show_timer BOOLEAN DEFAULT false,
  timer_minutes INTEGER DEFAULT 15,
  show_stock BOOLEAN DEFAULT false,
  show_testimonials BOOLEAN DEFAULT false,
  require_phone BOOLEAN DEFAULT true,
  require_cpf BOOLEAN DEFAULT true,
  
  -- Custom texts
  headline TEXT,
  subheadline TEXT,
  cta_text VARCHAR(100) DEFAULT 'Comprar Agora',
  success_message TEXT DEFAULT 'Obrigado pela sua compra!',
  
  -- Pixel/tracking
  facebook_pixel TEXT,
  google_analytics TEXT,
  tiktok_pixel TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, draft
  visits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checkout Products (many-to-many relationship)
CREATE TABLE IF NOT EXISTS checkout_product_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id UUID NOT NULL REFERENCES checkouts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES checkout_products(id) ON DELETE CASCADE,
  custom_price DECIMAL(10, 2), -- Override product price for this checkout
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(checkout_id, product_id)
);

-- Coupons
CREATE TABLE IF NOT EXISTS checkout_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- percentage, fixed
  discount_value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER, -- NULL = unlimited
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checkout Coupons (which coupons apply to which checkouts)
CREATE TABLE IF NOT EXISTS checkout_coupon_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id UUID NOT NULL REFERENCES checkouts(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES checkout_coupons(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(checkout_id, coupon_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS checkout_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id UUID NOT NULL REFERENCES checkouts(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Customer info
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_cpf VARCHAR(14),
  
  -- Shipping address (if physical product)
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(2),
  shipping_zip VARCHAR(10),
  
  -- Order details
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  coupon_id UUID REFERENCES checkout_coupons(id),
  coupon_code VARCHAR(50),
  
  -- Payment
  payment_method VARCHAR(20) DEFAULT 'pix', -- pix, card, boleto
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_id TEXT, -- External payment ID
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery (for digital products)
  delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS checkout_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES checkout_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES checkout_products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkout_products_user ON checkout_products(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_products_status ON checkout_products(status);
CREATE INDEX IF NOT EXISTS idx_checkouts_user ON checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_slug ON checkouts(slug);
CREATE INDEX IF NOT EXISTS idx_checkouts_status ON checkouts(status);
CREATE INDEX IF NOT EXISTS idx_checkout_orders_seller ON checkout_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_checkout_orders_checkout ON checkout_orders(checkout_id);
CREATE INDEX IF NOT EXISTS idx_checkout_orders_status ON checkout_orders(status);
CREATE INDEX IF NOT EXISTS idx_checkout_orders_payment_status ON checkout_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_checkout_coupons_user ON checkout_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_coupons_code ON checkout_coupons(code);
