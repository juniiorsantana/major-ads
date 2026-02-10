# PRD - Meta Ads Manager Pro

## Visão Geral do Produto

**Nome:** Meta Ads Manager Pro (AdsManager Pro)  
**Descrição:** Dashboard SaaS para gestão e análise de campanhas Meta Ads (Facebook/Instagram)  
**Stack Técnica:** React 19 + Vite + TypeScript + Supabase + Recharts

---

## Estado Atual do Produto

### ✅ Funcionalidades Implementadas

#### 1. Autenticação
- [x] Login/Registro via Supabase Auth (email/senha)
- [x] Rotas protegidas com `ProtectedRoute`
- [x] Context de autenticação (`AuthContext`)
- [x] Persistência de sessão

#### 2. Integração Meta API
- [x] Facebook OAuth Login (SDK frontend)
- [x] Edge Functions Supabase:
  - `meta-auth`: Troca de token Facebook, criação/atualização usuário
  - `meta-api`: Proxy para Graph API (businesses, ad accounts, pages, Instagram, campaigns)
- [x] Suporte a modo Mock (fallback quando não configurado)
- [x] Armazenamento seguro de tokens no user_metadata

#### 3. Dashboard - Visão Geral
- [x] Barra de filtros (período, comparação, agrupamento)
- [x] Cards KPI draggable com sparklines
- [x] Gráfico temporal interativo (Recharts)
- [x] Distribuição de budget (por campanha, objetivo, plataforma, audiência)
- [x] Alertas e recomendações

#### 4. Gestão de Campanhas
- [x] Listagem de campanhas (cards e tabela)
- [x] Filtros por status (ativas, pausadas, arquivadas)
- [x] Ordenação (ROAS, spend, performance, data)
- [x] Fetch de múltiplos Business Managers
- [x] Estados de loading e erro

#### 5. Configurações
- [x] Perfil do usuário
- [x] Conexão/desconexão Facebook
- [x] Seleção múltipla de Business Managers
- [x] Modal de confirmação e toasts

#### 6. Layout & UX
- [x] Sidebar colapsável com navegação
- [x] Design responsivo
- [x] Interface em português (pt-BR)
- [x] Ícones Lucide React

---

## 🔴 Gaps Críticos

### 1. Dados Reais vs Mock
| Área | Status |
|------|--------|
| Dashboard KPIs | ✅ Dados Reais |
| Gráficos Temporais | ✅ Dados Reais |
| Distribuição Budget | ✅ Dados Reais |
| Alertas | ❌ Mock Data (Pendente) |
| Insights de Campanha | ✅ Implementado |

> **Problema:** O dashboard exibe apenas dados simulados. Não há integração real com insights da Meta API.

### 2. Meta API - Endpoints Faltantes
- [x] `/insights` para métricas de campanha
- [ ] `/adsets` para conjuntos de anúncios
- [ ] `/ads` para anúncios individuais
- [ ] Filtros temporais na API
- [ ] Paginação de resultados

### 3. Página "Ferramentas de IA"
- [ ] Apenas placeholder ("Em breve...")
- [ ] Nenhuma funcionalidade implementada

### 4. Ações de Campanha
- [ ] Criar campanha (botão existe, função não conectada)
- [ ] Pausar/Ativar campanha (TODO no código)
- [ ] Editar campanha
- [ ] Visualizar detalhes da campanha

---

## 🟡 Melhorias Necessárias

### Performance & Arquitetura

| Prioridade | Melhoria | Justificativa |
|------------|----------|---------------|
| Alta | Implementar React Query/SWR | Cache e revalidação de dados |
| Alta | Adicionar error boundaries | Evitar crashes globais |
| Média | Lazy loading de rotas | Reduzir bundle inicial |
| Média | Service Workers + Cache | Funcionamento offline |
| Baixa | Migrar para Zustand/Jotai | Substituir localStorage por state management |

### Segurança

| Prioridade | Melhoria | Justificativa |
|------------|----------|---------------|
| **Crítica** | Renovação automática de token | Tokens Facebook expiram |
| Alta | Rate limiting nas Edge Functions | Prevenir abuso |
| Alta | Validação de inputs no backend | XSS/Injection |
| Média | Logs de auditoria | Rastreabilidade |

### UX/UI

| Prioridade | Melhoria | Justificativa |
|------------|----------|---------------|
| Alta | Skeleton loaders | Percepção de velocidade |
| Alta | Onboarding flow | Primeira conexão confusa |
| Média | Dark mode | Preferência do usuário |
| Média | Mobile app shell | Melhor experiência mobile |
| Baixa | Animações micro-interactions | Polimento visual |

---

## 🟢 Funcionalidades Futuras (Backlog)

### Fase 1: Dados Reais (Crítico)
1. **Insights API Integration**
   - Buscar métricas reais (spend, impressions, clicks, CTR, CPM, ROAS)
   - Implementar filtros de data no backend
   - Agregar dados por período (dia, semana, mês)

2. **Dashboard Conectado**
   - KPIs com dados reais
   - Gráficos com série temporal real
   - Comparação com período anterior

### Fase 2: Gestão Completa
1. **CRUD de Campanhas**
   - Wizard de criação de campanha
   - Edição inline
   - Duplicar campanha
   - Arquivar/Excluir

2. **Ad Sets & Ads**
   - Hierarquia Campaign → Ad Set → Ad
   - Visualização em árvore
   - Edição de budget por ad set

3. **Regras Automatizadas**
   - Pausar se CPA > X
   - Aumentar budget se ROAS > Y
   - Notificações

### Fase 3: Inteligência
1. **Ferramentas IA (Gemini)**
   - Copy de anúncios
   - Sugestões de público
   - Análise de criativos
   - Previsão de resultados

2. **Relatórios**
   - PDF export
   - Agendamento de relatórios
   - White-label para agências

3. **Multi-tenant**
   - Workspaces
   - Permissões por usuário
   - API keys para integrações

### Fase 4: Expansão
1. **Google Ads Integration**
2. **TikTok Ads Integration**
3. **LinkedIn Ads Integration**
4. **Consolidação cross-platform**

---

## Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   React + Vite                       │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │   │
│  │  │  Pages    │ │Components │ │     Services      │  │   │
│  │  │ -Dashboard│ │ -Overview │ │ -metaService.ts   │  │   │
│  │  │ -Campaigns│ │ -Campaigns│ │ -facebookSDK.ts   │  │   │
│  │  │ -Settings │ │ -UI       │ │ -supabaseClient.ts│  │   │
│  │  └───────────┘ └───────────┘ └───────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                  │
│  ┌─────────────────────┐    ┌─────────────────────────┐    │
│  │     meta-auth       │    │       meta-api          │    │
│  │  - FB token verify  │    │  - businesses           │    │
│  │  - User create/update│   │  - adaccounts           │    │
│  │  - Store in metadata│    │  - pages/instagram      │    │
│  └─────────────────────┘    │  - campaigns CRUD       │    │
│                              └─────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    META GRAPH API v18.0                     │
│  /me/businesses  /act_{id}/campaigns  /act_{id}/insights   │
└─────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Arquivos

```
meta-ads-major/
├── src/
│   ├── App.tsx                 # Router principal
│   ├── main.tsx               # Entry point
│   ├── types.ts               # Tipos TypeScript
│   ├── components/
│   │   ├── campaigns/         # CampaignCard, Table, Filters
│   │   ├── overview/          # KPI Cards, Charts, FilterBar
│   │   └── ui/                # ConfirmModal, Toast
│   ├── context/
│   │   └── AuthContext.tsx    # Supabase Auth context
│   ├── hooks/                 # Custom hooks
│   ├── layouts/
│   │   └── DashboardLayout.tsx # Sidebar + main content
│   ├── pages/
│   │   ├── auth/              # Login, Register
│   │   ├── campaigns/         # Campanhas
│   │   ├── dashboard/         # Home (Visão Geral)
│   │   └── settings/          # Configurações
│   └── services/
│       ├── facebookSDK.ts     # FB SDK wrapper
│       ├── geminiService.ts   # Gemini AI (parcial)
│       ├── metaService.ts     # Meta API service
│       └── supabaseClient.ts  # Supabase client
├── supabase/
│   └── functions/
│       ├── meta-api/          # Proxy Meta Graph API
│       └── meta-auth/         # Facebook OAuth handler
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Variáveis de Ambiente Necessárias

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# Meta/Facebook
VITE_META_APP_ID=xxx

# Gemini AI (opcional)
GEMINI_API_KEY=xxx

# Edge Functions (secrets no Supabase)
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
PRIVATE_SERVICE_ROLE_KEY=xxx
```

---

## Próximos Passos Recomendados

### Imediato (Sprint 1) - 2 semanas
1. ⚡ **Implementar Insights API** no backend
2. ⚡ **Conectar Dashboard com dados reais**
3. 🔒 **Renovação automática de token Facebook**
4. 🎨 **Adicionar skeleton loaders**

### Curto Prazo (Sprint 2-3) - 4 semanas
1. 📊 **Detalhes de Campanha** - página individual
2. 🛠️ **CRUD completo de campanhas**
3. 📈 **Ad Sets e Ads** - hierarquia completa
4. 🔔 **Sistema de notificações**

### Médio Prazo (Sprint 4-6) - 6 semanas
1. 🤖 **Ferramentas IA** - copy, análise, sugestões
2. 📄 **Relatórios** - PDF export
3. 👥 **Multi-usuário** - permissões
4. 🌙 **Dark mode**

---

## Métricas de Sucesso

| Métrica | Meta | Status Atual |
|---------|------|--------------|
| Conexão com Meta | 100% | ✅ OK |
| Dados reais no dashboard | 100% | ✅ 100% |
| Ações de campanha | 4 ações | ❌ 0/4 |
| Cobertura de testes | >80% | ❌ 0% |
| Tempo de carregamento | <2s | ⚠️ Não medido |
| NPS | >50 | ❌ Não medido |

---

## Conclusão

O **Meta Ads Manager Pro** tem uma base sólida de autenticação e integração com a Meta API, e agora exibe **dados reais** no dashboard. A prioridade agora é expandir a gestão de campanhas.

A arquitetura está bem estruturada e permite expansão. As Edge Functions do Supabase fornecem uma camada segura para a API, mas precisam de endpoints adicionais (insights, adsets, ads) e renovação de tokens.

**Recomendação:** Focar na **Fase 2** (Gestão Completa) e melhorias de UX.
