-- Adiciona coluna kyc_status na tabela profiles se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'kyc_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN kyc_status text DEFAULT 'pending';
  END IF;
END $$;

-- Cria tabela kyc_documents
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL, -- 'identity', 'identity_back', 'selfie', 'address_proof'
  file_url text NOT NULL,
  file_name text,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilita RLS
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para kyc_documents
DROP POLICY IF EXISTS "kyc_documents_select_own" ON kyc_documents;
CREATE POLICY "kyc_documents_select_own" ON kyc_documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "kyc_documents_insert_own" ON kyc_documents;
CREATE POLICY "kyc_documents_insert_own" ON kyc_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "kyc_documents_admin_all" ON kyc_documents;
CREATE POLICY "kyc_documents_admin_all" ON kyc_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS kyc_documents_user_id_idx ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS kyc_documents_status_idx ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS kyc_documents_created_at_idx ON kyc_documents(created_at DESC);
