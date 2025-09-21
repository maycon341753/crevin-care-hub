# 🔧 Instruções para Correção do Banco de Dados

## ❌ Problemas Identificados:
1. **Recursão infinita nas políticas RLS** - causando erro "User not allowed"
2. **Usuário desenvolvedor não existe** - causando "Invalid login credentials"
3. **Possíveis tabelas não criadas** - estrutura incompleta

## ✅ Solução - Execute na ORDEM EXATA:

### 1️⃣ PRIMEIRO: Corrigir Recursão RLS
```sql
-- Execute no SQL Editor do Supabase Dashboard:
-- Copie e cole o conteúdo do arquivo: fix_rls_recursion.sql
```

### 2️⃣ SEGUNDO: Criar Tabelas (se necessário)
```sql
-- Execute no SQL Editor do Supabase Dashboard:
-- Copie e cole o conteúdo do arquivo: create_tables_simple.sql
```

### 3️⃣ TERCEIRO: Criar Usuário Desenvolvedor

**Opção A - Via SQL (Recomendado):**
```sql
-- Execute no SQL Editor do Supabase Dashboard:
-- Copie e cole o conteúdo do arquivo: create_dev_user_manual.sql
```

**Opção B - Via Dashboard (Alternativa):**
1. Vá para: **Supabase Dashboard > Authentication > Users**
2. Clique em **"Add user"**
3. Preencha:
   - **Email:** `desenvolvedor@crevin.com.br`
   - **Password:** `Dev@2025`
   - **Confirm password:** `Dev@2025`
4. Clique em **"Create user"**
5. Execute no SQL Editor:
```sql
UPDATE public.profiles 
SET role = 'developer' 
WHERE email = 'desenvolvedor@crevin.com.br';
```

### 4️⃣ QUARTO: Verificar Correções
Execute este comando no SQL Editor para verificar:
```sql
-- Verificar usuário criado
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.role,
    p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'desenvolvedor@crevin.com.br';

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 5️⃣ QUINTO: Testar Login
Após executar todos os scripts, teste o login com:
- **Email:** `desenvolvedor@crevin.com.br`
- **Senha:** `Dev@2025`

## 📁 Arquivos Criados:
- `fix_rls_recursion.sql` - Corrige recursão infinita nas políticas RLS
- `create_dev_user_manual.sql` - Cria usuário desenvolvedor
- `create_tables_simple.sql` - Cria estrutura de tabelas (já existente)
- `setup_rls_policies.sql` - Políticas RLS (já existente, mas com problemas)

## ⚠️ IMPORTANTE:
1. **Execute os scripts na ORDEM EXATA** listada acima
2. **Use o SQL Editor** do Supabase Dashboard, não o terminal
3. **Aguarde** cada script terminar antes de executar o próximo
4. **Verifique** se não há erros após cada execução

## 🆘 Se ainda houver problemas:
1. Verifique se todas as tabelas foram criadas
2. Confirme se o usuário desenvolvedor existe no Authentication
3. Teste o login novamente
4. Verifique os logs do Supabase para erros específicos

---
**Status:** Pronto para execução
**Última atualização:** $(Get-Date -Format "dd/MM/yyyy HH:mm")