# 🚨 Solução de Erros: Conexão Meta API (401 Unauthorized / Invalid JWT)

Este arquivo documenta a solução definitiva para o erro recorrente de "Invalid JWT" ou falha de autenticação ao conectar com o Meta Ads.

## 🔴 O Problema
- **Erro:** "Invalid JWT" ou status `401 Unauthorized` constante.
- **Sintoma:** O usuário faz login no Facebook com sucesso, mas ao tentar listar contas ou campanhas, ocorre erro imediato.
- **Logs:** Os logs da Edge Function mostram `401` antes mesmo de qualquer log da aplicação aparecer.

## 🔎 Causa Raiz
O Supabase Edge Functions possui uma flag chamada `verify_jwt`. Quando habilitada (`true`), o **Gateway do Supabase tenta validar o token JWT antes de executar sua função**.

Devido a mudanças recentes na infraestrutura do Supabase (migração para chaves de assinatura assimétricas), essa validação no gateway falha frequentemente para tokens de sessão, bloqueando a requisição antes que seu código possa executá-la.

## ✅ A Solução (Definitiva)
**Desabilitar a verificação de JWT no Gateway (`verify_jwt: false`).**

Nossas funções (`meta-api` e `meta-auth`) já realizam a autenticação internamente de forma segura via código:

```typescript
// O código já faz isso internamente:
const supabase = createSupabaseClient(req);
const { data: { user }, error } = await supabase.auth.getUser();
if (error) throw new Error("Unauthorized");
```

Portanto, a validação do Gateway é redundante e causadora do problema.

## 🚀 Como Fazer o Deploy Corretamente

Sempre que fizer deploy da função `meta-api`, você **DEVE** desabilitar a verificação de JWT.

### Opção 1: Via CLI (Recomendado)
Execute o deploy com a flag `--no-verify-jwt`:
```bash
supabase functions deploy meta-api --no-verify-jwt
```

### Opção 2: Via Arquivo de Configuração (`supabase/config.toml`)
Garanta que o arquivo `config.toml` tenha a seguinte configuração:
```toml
[functions.meta-api]
verify_jwt = false
```

### Opção 3: Via Painel/MCP
Se estiver usando uma ferramenta de deploy automática (como o MCP), certifique-se de definir a opção `verify_jwt` como `false` para esta função.

---
**Nota:** A função `meta-auth` também deve ter `verify_jwt: false` pelo mesmo motivo.
