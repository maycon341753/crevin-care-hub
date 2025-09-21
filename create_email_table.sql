-- Script para criar tabela EMAIL no projeto CREVIN
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar a tabela email para gerenciar comunicações por email
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email') THEN
    CREATE TABLE public.email (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      
      -- Informações do remetente
      from_email TEXT NOT NULL,
      from_name TEXT,
      
      -- Informações do destinatário
      to_email TEXT NOT NULL,
      to_name TEXT,
      
      -- Cópia e cópia oculta
      cc_emails TEXT[], -- Array de emails em cópia
      bcc_emails TEXT[], -- Array de emails em cópia oculta
      
      -- Conteúdo do email
      subject TEXT NOT NULL,
      body_text TEXT, -- Versão texto simples
      body_html TEXT, -- Versão HTML
      
      -- Metadados
      email_type TEXT NOT NULL DEFAULT 'notification' CHECK (
        email_type IN ('notification', 'marketing', 'transactional', 'system', 'welcome', 'password_reset', 'verification')
      ),
      priority TEXT NOT NULL DEFAULT 'normal' CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
      ),
      
      -- Status do email
      status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'spam', 'opened', 'clicked')
      ),
      
      -- Informações de envio
      sent_at TIMESTAMP WITH TIME ZONE,
      delivered_at TIMESTAMP WITH TIME ZONE,
      opened_at TIMESTAMP WITH TIME ZONE,
      clicked_at TIMESTAMP WITH TIME ZONE,
      failed_at TIMESTAMP WITH TIME ZONE,
      
      -- Informações de erro
      error_message TEXT,
      error_code TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 3,
      
      -- Rastreamento
      message_id TEXT UNIQUE, -- ID do provedor de email (SendGrid, etc.)
      tracking_id TEXT UNIQUE, -- ID interno de rastreamento
      
      -- Relacionamentos
      user_id UUID, -- Usuário relacionado (se aplicável)
      related_table TEXT, -- Tabela relacionada (funcionarios, idosos, etc.)
      related_id UUID, -- ID do registro relacionado
      
      -- Template usado
      template_id UUID,
      template_variables JSONB DEFAULT '{}',
      
      -- Anexos
      attachments JSONB DEFAULT '[]', -- Array de objetos com informações dos anexos
      
      -- Configurações
      is_bulk BOOLEAN NOT NULL DEFAULT false,
      bulk_campaign_id UUID,
      
      -- Auditoria
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    RAISE NOTICE 'Tabela email criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela email já existe.';
  END IF;
END $$;

-- Criar tabela para templates de email
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_templates') THEN
    CREATE TABLE public.email_templates (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      
      -- Conteúdo do template
      subject_template TEXT NOT NULL,
      body_text_template TEXT,
      body_html_template TEXT NOT NULL,
      
      -- Variáveis disponíveis
      available_variables JSONB DEFAULT '[]', -- Array de variáveis que podem ser usadas
      
      -- Configurações
      email_type TEXT NOT NULL DEFAULT 'notification' CHECK (
        email_type IN ('notification', 'marketing', 'transactional', 'system', 'welcome', 'password_reset', 'verification')
      ),
      is_active BOOLEAN NOT NULL DEFAULT true,
      
      -- Auditoria
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    RAISE NOTICE 'Tabela email_templates criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela email_templates já existe.';
  END IF;
END $$;

-- Criar tabela para configurações de email
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_settings') THEN
    CREATE TABLE public.email_settings (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      
      -- Configurações SMTP
      smtp_host TEXT,
      smtp_port INTEGER DEFAULT 587,
      smtp_username TEXT,
      smtp_password TEXT, -- Deve ser criptografado
      smtp_use_tls BOOLEAN DEFAULT true,
      smtp_use_ssl BOOLEAN DEFAULT false,
      
      -- Configurações do provedor
      provider TEXT NOT NULL DEFAULT 'smtp' CHECK (
        provider IN ('smtp', 'sendgrid', 'mailgun', 'ses', 'postmark')
      ),
      api_key TEXT, -- Para provedores de API
      api_secret TEXT, -- Para provedores que precisam
      
      -- Configurações padrão
      default_from_email TEXT NOT NULL,
      default_from_name TEXT NOT NULL,
      default_reply_to TEXT,
      
      -- Limites
      daily_limit INTEGER DEFAULT 1000,
      hourly_limit INTEGER DEFAULT 100,
      
      -- Status
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_default BOOLEAN NOT NULL DEFAULT false,
      
      -- Auditoria
      created_by UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    RAISE NOTICE 'Tabela email_settings criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela email_settings já existe.';
  END IF;
END $$;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para updated_at
DO $$
BEGIN
  -- Trigger para email
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email') THEN
    DROP TRIGGER IF EXISTS update_email_updated_at ON public.email;
    CREATE TRIGGER update_email_updated_at
      BEFORE UPDATE ON public.email
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Trigger para email_templates
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_templates') THEN
    DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
    CREATE TRIGGER update_email_templates_updated_at
      BEFORE UPDATE ON public.email_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  -- Trigger para email_settings
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_settings') THEN
    DROP TRIGGER IF EXISTS update_email_settings_updated_at ON public.email_settings;
    CREATE TRIGGER update_email_settings_updated_at
      BEFORE UPDATE ON public.email_settings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_email_to_email ON public.email(to_email);
CREATE INDEX IF NOT EXISTS idx_email_from_email ON public.email(from_email);
CREATE INDEX IF NOT EXISTS idx_email_status ON public.email(status);
CREATE INDEX IF NOT EXISTS idx_email_email_type ON public.email(email_type);
CREATE INDEX IF NOT EXISTS idx_email_created_at ON public.email(created_at);
CREATE INDEX IF NOT EXISTS idx_email_sent_at ON public.email(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_user_id ON public.email(user_id);
CREATE INDEX IF NOT EXISTS idx_email_related_table_id ON public.email(related_table, related_id);
CREATE INDEX IF NOT EXISTS idx_email_message_id ON public.email(message_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_id ON public.email(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_bulk_campaign_id ON public.email(bulk_campaign_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON public.email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_email_type ON public.email_templates(email_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_settings_provider ON public.email_settings(provider);
CREATE INDEX IF NOT EXISTS idx_email_settings_is_active ON public.email_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_email_settings_is_default ON public.email_settings(is_default);

-- Habilitar RLS nas tabelas
ALTER TABLE public.email ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas
CREATE POLICY "Allow all access to email" ON public.email
  FOR ALL USING (true);

CREATE POLICY "Allow all access to email_templates" ON public.email_templates
  FOR ALL USING (true);

CREATE POLICY "Allow all access to email_settings" ON public.email_settings
  FOR ALL USING (true);

-- Inserir templates padrão
INSERT INTO public.email_templates (name, description, subject_template, body_html_template, email_type, available_variables, created_by)
VALUES 
(
  'welcome_user',
  'Template de boas-vindas para novos usuários',
  'Bem-vindo ao CREVIN, {{user_name}}!',
  '<h1>Bem-vindo ao CREVIN!</h1><p>Olá {{user_name}},</p><p>Seja bem-vindo ao sistema CREVIN. Sua conta foi criada com sucesso.</p><p>Atenciosamente,<br>Equipe CREVIN</p>',
  'welcome',
  '["user_name", "user_email", "login_url"]',
  '00000000-0000-0000-0000-000000000000'
),
(
  'password_reset',
  'Template para redefinição de senha',
  'Redefinir sua senha - CREVIN',
  '<h1>Redefinição de Senha</h1><p>Olá {{user_name}},</p><p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p><p><a href="{{reset_url}}">Redefinir Senha</a></p><p>Se você não solicitou esta redefinição, ignore este email.</p><p>Atenciosamente,<br>Equipe CREVIN</p>',
  'password_reset',
  '["user_name", "user_email", "reset_url", "expires_at"]',
  '00000000-0000-0000-0000-000000000000'
),
(
  'notification_general',
  'Template para notificações gerais',
  'Notificação - {{subject}}',
  '<h1>{{subject}}</h1><p>{{message}}</p><p>Atenciosamente,<br>Equipe CREVIN</p>',
  'notification',
  '["subject", "message", "user_name"]',
  '00000000-0000-0000-0000-000000000000'
);

-- Inserir configuração padrão
INSERT INTO public.email_settings (
  provider,
  default_from_email,
  default_from_name,
  is_active,
  is_default,
  created_by
) VALUES (
  'smtp',
  'noreply@crevin.com.br',
  'Sistema CREVIN',
  true,
  true,
  '00000000-0000-0000-0000-000000000000'
);

-- Comentários nas tabelas
COMMENT ON TABLE public.email IS 'Tabela para gerenciar emails enviados pelo sistema';
COMMENT ON TABLE public.email_templates IS 'Templates de email para diferentes tipos de comunicação';
COMMENT ON TABLE public.email_settings IS 'Configurações de email e provedores SMTP/API';

-- Comentários nas colunas principais
COMMENT ON COLUMN public.email.email_type IS 'Tipo do email: notification, marketing, transactional, system, welcome, password_reset, verification';
COMMENT ON COLUMN public.email.status IS 'Status do email: pending, sent, delivered, failed, bounced, spam, opened, clicked';
COMMENT ON COLUMN public.email.priority IS 'Prioridade do email: low, normal, high, urgent';
COMMENT ON COLUMN public.email.related_table IS 'Tabela relacionada ao email (funcionarios, idosos, etc.)';
COMMENT ON COLUMN public.email.template_variables IS 'Variáveis usadas no template do email';
COMMENT ON COLUMN public.email.attachments IS 'Array JSON com informações dos anexos';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '=== TABELA EMAIL CRIADA COM SUCESSO ===';
  RAISE NOTICE 'Tabelas criadas:';
  RAISE NOTICE '- public.email (emails enviados)';
  RAISE NOTICE '- public.email_templates (templates de email)';
  RAISE NOTICE '- public.email_settings (configurações de email)';
  RAISE NOTICE '';
  RAISE NOTICE 'Recursos incluídos:';
  RAISE NOTICE '- Triggers para updated_at automático';
  RAISE NOTICE '- Índices para melhor performance';
  RAISE NOTICE '- Políticas RLS habilitadas';
  RAISE NOTICE '- Templates padrão inseridos';
  RAISE NOTICE '- Configuração padrão inserida';
  RAISE NOTICE '';
  RAISE NOTICE 'A tabela está pronta para uso!';
END $$;