# Especificação do Projeto - Meta Ads SaaS Pro

## 1. Visão Geral

**Nome do Projeto:** Meta Ads SaaS Pro
**Descrição:** Aplicação SaaS para análise e gerenciamento de campanhas do Meta Ads, focada em fornecer insights acionáveis e uma interface simplificada para gestores de tráfego.
**Repositório:** `meta-ads-saas-pro` (interno: `major-ads`)

## 2. Tecnologias e Arquitetura

### 2.1 Stack Tecnológica

**Frontend:**
*   **Framework:** React 19 + Vite
*   **Linguagem:** TypeScript
*   **Estilização:** Tailwind CSS v4
*   **Gerenciamento de Estado:** Zustand
*   **Data Fetching:** TanStack Query (React Query) v5
*   **Visualização de Dados:** Recharts
*   **Roteamento:** React Router v7
*   **Ícones:** Lucide React

**Backend (Serverless):**
*   **Plataforma:** Supabase
*   **Banco de Dados:** PostgreSQL (Supabase DB)
*   **Auth:** Supabase Auth (Email/Password + Integrações)
*   **Edge Functions:** Deno (TypeScript)

**IA & Integrações:**
*   **Meta Graph API:** v21.0
*   **IA Generativa:** Google Gemini (`@google/genai`)

### 2.2 Estrutura de Pastas

```
/src
  /components       # Componentes de UI reutilizáveis
  /context          # Contextos React (ex: AuthContext)
  /hooks            # Custom Hooks
  /layouts          # Layouts de página (DashboardLayout)
  /pages            # Páginas da aplicação (Roteamento)
  /services         # Serviços de API (Meta, Supabase, Gemini)
  /stores           # Stores Zustand (Estado global)
  /types            # Definições de Tipos TypeScript
/supabase
  /functions        # Edge Functions
    /meta-api       # Proxy para Meta API
    /meta-auth      # Autenticação e Troca de Tokens Meta
  /migrations       # Scripts SQL de banco de dados
```

## 3. Funcionalidades Principais

### 3.1 Autenticação e Onboarding
*   **Login/Registro:** Via Supabase Auth.
*   **Onboarding:** Fluxo guiado para coletar informações do perfil do usuário (Nome, Empresa, Função, Objetivos).
*   **Conexão Meta:** OAuth 2.0 para conectar contas do Facebook/Instagram.
    *   Troca de token de curto prazo por token de longo prazo (60 dias).
    *   Armazenamento seguro de tokens no `user_metadata`.

### 3.2 Dashboard Principal
*   **Visão Geral:** Cards de KPI principais (Spend, Impressions, Clicks, CTR, CPM, ROAS).
*   **Gráficos:** Visualização temporal de métricas.
*   **Filtros:**
    *   Seletor de Conta de Anúncios.
    *   Períodos de data (hoje, ontem, ultimos 7/30 dias, customizado).
    *   Comparação com períodos anteriores.

### 3.3 Gestão de Campanhas
*   **Listagem:** Visualização de campanhas com status e métricas principais.
*   **Detalhes:** Insights performance semanais/diários.
*   **Criação/Edição:** (Funcionalidade prevista na API `create_campaign`, `update_campaign`).

### 3.4 Ferramentas de IA
*   Integração com Gemini para análise de dados e sugestões (placeholder implementado).

## 4. Banco de Dados e Modelagem

### 4.1 Tabelas de Dados (`public`)

**`user_profiles`**
*   `id`: UUID (FK -> auth.users.id)
*   `full_name`: Text
*   `company_name`: Text
*   `role`: Text
*   `business_type`: Text
*   `goals`: Text Array
*   `created_at`, `updated_at`: Timestamp

### 4.2 Segurança (RLS)
*   **Políticas:** Usuários podem apenas visualizar, inserir e atualizar seus próprios dados (`auth.uid() = id`).

## 5. API e Edge Functions

### 5.1 `meta-auth`
Gerencia o fluxo de autenticação com o Facebook.
*   **Ações:**
    *   `authenticate`: Valida token do Facebook e troca por token de longo prazo.
    *   `refresh_token`: Renova tokens expirados.

### 5.2 `meta-api`
Proxy seguro para a Meta Graph API.
*   **Middleware:**
    *   Validação de JWT Supabase.
    *   Rate Limiting por usuário.
    *   Logs de requisição.
*   **Ações Suportadas:**
    *   `businesses`: Lista Business Managers.
    *   `adaccounts`: Lista contas de anúncios (próprias e de clientes).
    *   `campaigns`: Lista campanhas de uma conta.
    *   `campaigns_with_insights`: Campanhas enriquecidas com métricas.
    *   `insights`, `insights_timeseries`: Métricas agregadas e temporais.

## 6. Variáveis de Ambiente

### Frontend (`.env.local`)
*   `VITE_SUPABASE_URL`: URL do projeto Supabase.
*   `VITE_SUPABASE_ANON_KEY`: Chave pública anônima.
*   `GEMINI_API_KEY`: Chave de API Google Gemini.

### Backend (Supabase Secrets)
*   `SUPABASE_URL`: URL interna.
*   `SUPABASE_ANON_KEY`: Chave anônima.
*   `PRIVATE_SERVICE_ROLE_KEY`: Chave de serviço (ADMIN) para atualizar metadados de usuário.
*   `META_APP_ID`: ID do App Meta.
*   `META_APP_SECRET`: Segredo do App Meta.
