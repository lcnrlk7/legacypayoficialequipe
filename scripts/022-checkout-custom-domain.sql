-- Add custom_domain column to checkouts table
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE;

-- Add more fields based on the config.yaml
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS order_bump_enabled BOOLEAN DEFAULT false;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS order_bump_product_id UUID REFERENCES checkout_products(id);
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS order_bump_title VARCHAR(255);
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS order_bump_description TEXT;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS order_bump_price DECIMAL(10,2);

-- Customer info fields
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS require_name BOOLEAN DEFAULT true;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS require_email BOOLEAN DEFAULT true;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS require_address BOOLEAN DEFAULT false;

-- Delivery settings
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT 'automatic';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS delivery_link TEXT;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS delivery_file_url TEXT;

-- Timer and urgency
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS timer_enabled BOOLEAN DEFAULT false;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS timer_redirect_url TEXT;

-- URLs
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS success_url TEXT;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS cancel_url TEXT;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS return_url TEXT;

-- Theme
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'dark';
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) DEFAULT '#f97316';

-- SEO
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS seo_image TEXT;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Social proof
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS show_visitor_counter BOOLEAN DEFAULT false;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS visitor_counter_min INTEGER DEFAULT 10;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS visitor_counter_max INTEGER DEFAULT 50;
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS show_social_proof BOOLEAN DEFAULT false;

-- Create index for custom domain lookups
CREATE INDEX IF NOT EXISTS idx_checkouts_custom_domain ON checkouts(custom_domain) WHERE custom_domain IS NOT NULL;
