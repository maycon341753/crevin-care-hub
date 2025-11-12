-- Migration: Add admin SELECT policy for licencas_funcionamento (crevin-care-hub)
-- Date: 2025-11-12

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'licencas_funcionamento'
      AND policyname = 'licencas_funcionamento_select_admin'
  ) THEN
    CREATE POLICY licencas_funcionamento_select_admin ON public.licencas_funcionamento
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid()
            AND p.role IN ('admin','developer')
        )
      );
  END IF;
END $$;