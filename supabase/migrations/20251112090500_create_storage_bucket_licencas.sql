-- Create Supabase Storage bucket for Licenças de Funcionamento (idempotent)
-- Date: 2025-11-12

-- Create bucket 'licencas' only if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'licencas'
  ) THEN
    -- Prefer using storage.create_bucket if available; otherwise insert directly
    IF EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.proname = 'create_bucket' AND n.nspname = 'storage'
    ) THEN
      PERFORM storage.create_bucket('licencas', true);
    ELSE
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('licencas', 'licencas', true)
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- Policies for authenticated users to manage objects in 'licencas' bucket
-- Note: Public read is granted by the bucket being public

-- INSERT: allow authenticated users to upload into 'licencas'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'licencas_insert_authenticated'
  ) THEN
    CREATE POLICY licencas_insert_authenticated ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'licencas');
  END IF;
END $$;

-- UPDATE: allow owners to update their own files in 'licencas'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'licencas_update_owner'
  ) THEN
    CREATE POLICY licencas_update_owner ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'licencas' AND owner = auth.uid())
      WITH CHECK (bucket_id = 'licencas' AND owner = auth.uid());
  END IF;
END $$;

-- DELETE: allow owners to delete their own files in 'licencas'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'licencas_delete_owner'
  ) THEN
    CREATE POLICY licencas_delete_owner ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'licencas' AND owner = auth.uid());
  END IF;
END $$;

COMMENT ON POLICY licencas_insert_authenticated ON storage.objects IS 'Permit upload para usuários autenticados no bucket licencas';
COMMENT ON POLICY licencas_update_owner ON storage.objects IS 'Permite atualização apenas pelo dono no bucket licencas';
COMMENT ON POLICY licencas_delete_owner ON storage.objects IS 'Permite exclusão apenas pelo dono no bucket licencas';