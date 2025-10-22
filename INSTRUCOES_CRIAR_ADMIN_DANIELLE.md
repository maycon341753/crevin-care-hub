# 🚀 INSTRUÇÕES PARA CRIAR USUÁRIO ADMINISTRATIVO - DANIELLE

## 📋 Dados do Usuário
- **Nome:** Danielle da Silva Moura
- **Email:** daniellemoura16@gmail.com
- **CPF:** 05437633157
- **Função:** Administrador

## 🔧 PASSO A PASSO

### 1️⃣ PRIMEIRO: Criar usuário no Dashboard do Supabase

1. Acesse o **Dashboard do Supabase** do seu projeto
2. Vá para: **Authentication > Users**
3. Clique em **"Add user"**
4. Preencha os dados:
   - **Email:** `daniellemoura16@gmail.com`
   - **Password:** `Admin@2025` (ou defina uma senha segura)
   - **Auto Confirm User:** ✅ (marque esta opção)
5. Clique em **"Create user"**

### 2️⃣ SEGUNDO: Executar o script SQL

1. No Dashboard do Supabase, vá para: **SQL Editor**
2. Clique em **"New query"**
3. Copie todo o conteúdo do arquivo `create_admin_danielle.sql`
4. Cole no editor SQL
5. Clique em **"Run"** para executar

### 3️⃣ VERIFICAR RESULTADO

O script irá:
- ✅ Verificar se o usuário foi criado no `auth.users`
- ✅ Criar o perfil na tabela `profiles` com role `admin`
- ✅ Inserir dados na tabela `users` (se existir)
- ✅ Inserir dados na tabela `funcionarios` com CPF (se existir)
- ✅ Mostrar o resultado final com todos os dados

## 🎯 O QUE O SCRIPT FAZ

### Tabela `auth.users`
- Verifica se o usuário existe (criado no passo 1)

### Tabela `public.profiles`
```sql
user_id: [UUID do usuário]
email: daniellemoura16@gmail.com
full_name: Danielle da Silva Moura
role: admin
```

### Tabela `public.users` (se existir)
```sql
auth_user_id: [UUID do usuário]
email: daniellemoura16@gmail.com
email_verified: true
status: active
```

### Tabela `public.funcionarios` (se existir)
```sql
nome: Danielle da Silva Moura
email: daniellemoura16@gmail.com
cpf: 05437633157
cargo: Administrador
status: ativo
```

## 🔍 VERIFICAÇÃO FINAL

Após executar o script, você verá:
- 👤 Dados do usuário no `auth.users`
- 🎯 Resultado final com perfil criado
- 👥 Dados na tabela `users` (se aplicável)
- 👨‍💼 Dados na tabela `funcionarios` (se aplicável)

## 🚨 IMPORTANTE

- **SEMPRE** crie o usuário no Dashboard PRIMEIRO
- **DEPOIS** execute o script SQL
- O script é seguro e usa `ON CONFLICT` para evitar duplicatas
- Se algo der errado, você pode executar o script novamente

## 🔐 LOGIN

Após a criação, Danielle poderá fazer login com:
- **Email:** daniellemoura16@gmail.com
- **Senha:** A senha definida no passo 1
- **Permissões:** Administrador completo

## 📞 SUPORTE

Se houver algum problema:
1. Verifique se o usuário foi criado no Dashboard
2. Execute o script novamente
3. Verifique os logs do script para mensagens de erro
4. Consulte a documentação do Supabase para troubleshooting

---

**✅ USUÁRIO ADMINISTRATIVO PRONTO PARA USO!**