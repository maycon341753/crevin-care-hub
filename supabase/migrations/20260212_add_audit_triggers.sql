-- Audit logging triggers for core tables
-- This migration adds a generic trigger function that writes changes to public.audit_logs
-- and attaches AFTER triggers to key tables to track INSERT/UPDATE/DELETE operations.

CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    created_at
  )
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    NULL,
    NULL,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to core tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'departamentos',
    'funcionarios',
    'doacoes_dinheiro',
    'doacoes_itens',
    'idosos'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS log_%I_insert ON public.%I;', t, t);
    EXECUTE format('DROP TRIGGER IF EXISTS log_%I_update ON public.%I;', t, t);
    EXECUTE format('DROP TRIGGER IF EXISTS log_%I_delete ON public.%I;', t, t);

    EXECUTE format('CREATE TRIGGER log_%I_insert AFTER INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();', t, t);
    EXECUTE format('CREATE TRIGGER log_%I_update AFTER UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();', t, t);
    EXECUTE format('CREATE TRIGGER log_%I_delete AFTER DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();', t, t);
  END LOOP;
END;
$$;

