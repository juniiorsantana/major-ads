# Architecture Decision Records (ARD)

Este documento registra as decisões arquiteturais significativas para o projeto Meta Ads SaaS Pro.

---

## ADR-001: Adoção do React 19 + Vite

*   **Status:** Aceito
*   **Data:** 11-02-2026
*   **Contexto:** Necessidade de um framework frontend moderno, performático e com forte ecossistema para construir uma Single Page Application (SPA). O *create-react-app* está depreciado e o Next.js traz complexidade de SSR que pode não ser estritamente necessária para um painel SaaS focado em cliente autenticado.
*   **Decisão:** Utilizar React 19 com Vite como ferramenta de build.
*   **Consequências:**
    *   **Positivas:** Desenvolvimento rápido (HMR instantâneo), build otimizado, acesso aos recursos mais recentes do React.
    *   **Negativas:** Menos otimizado para SEO público comparado ao Next.js (aceitável pois é uma ferramenta interna/painel).

## ADR-002: TypeScript como Linguagem Principal

*   **Status:** Aceito
*   **Data:** 11-02-2026
*   **Contexto:** O projeto envolve estruturas de dados complexas da API do Meta e lógica de negócios crítica. JavaScript puro aumenta o risco de erros em tempo de execução.
*   **Decisão:** Utilizar TypeScript estrito tanto no Frontend quanto nas Edge Functions (Deno).
*   **Consequências:**
    *   **Positivas:** Detecção de erros em tempo de compilação, melhor intellisense/autocompletar, código autodocumentável, manutenção facilitada.
    *   **Negativas:** Curva de aprendizado inicial, necessidade de definição de tipos.

## ADR-003: Tailwind CSS v4 para Estilização

*   **Status:** Aceito
*   **Data:** 11-02-2026
*   **Contexto:** Necessidade de construir uma UI consistente, responsiva e moderna sem a sobrecarga de escrever e manter arquivos CSS grandes ou complexidade de CSS-in-JS runtime.
*   **Decisão:** Adotar Tailwind CSS v4.
*   **Consequências:**
    *   **Positivas:** Desenvolvimento rápido de UI, bundle CSS reduzido (purging automático), consistência visual através de tokens.
    *   **Negativas:** HTML "poluído" com muitas classes (mitigado por componentes).

## ADR-004: Supabase como Plataforma Backend (BaaS)

*   **Status:** Aceito
*   **Data:** 11-02-2026
*   **Contexto:** A equipe precisa focar no produto e frontend, minimizando o tempo gasto configurando infraestrutura, deploy de banco de dados e servidores de autenticação.
*   **Decisão:** Utilizar Supabase.
*   **Consequências:**
    *   **Positivas:** PostgreSQL gerenciado, Autenticação pronta (inc. OAuth Meta), APIs instantâneas via PostgREST, Row Level Security (RLS) para segurança robusta.
    *   **Negativas:** Vendor lock-in relativo (embora seja open source e self-hostable), limites da camada gratuita/pro.

## ADR-005: Zustand para Gerenciamento de Estado Global

*   **Status:** Aceito
*   **Data:** 11-02-2026
*   **Contexto:** React Context API pode causar re-renderizações desnecessárias. Redux é verboso demais para o escopo. Precisamos de uma solução leve para estados como "Sessão do Usuário", "Filtros do Dashboard" e "Notificações".
*   **Decisão:** Utilizar Zustand.
*   **Consequências:**
    *   **Positivas:** API minimalista, sem boilerplate, alta performance (seletores granulares), fácil de usar fora de componentes React.
    *   **Negativas:** Menos estruturado que Redux para aplicações gigantescas (não é o caso atual).

## ADR-006: TanStack Query (React Query) para Estado do Servidor

*   **Status:** Aceito
*   **Data:** 11-02-2026
*   **Contexto:** Gerenciar estados de carregamento, erro, cache e revalidação de dados da API manualmente com `useEffect` e `useState` é propenso a bugs e difícil de manter.
*   **Decisão:** Utilizar TanStack Query v5.
*   **Consequências:**
    *   **Positivas:** Cache automático, revalidação em foco/online, deduplicação de requisições, tratamento simplificado de *loading/error states*.
    *   **Negativas:** Abstração adicional sobre o `fetch`.

## ADR-007: Edge Functions (Deno) para Integrações e Lógica de Negócios

*   **Status:** Aceito
*   **Data:** 11-02-2026
*   **Contexto:** O cliente não pode chamar a API do Meta diretamente com tokens sensíveis ou realizar operações complexas que exigem segredos de servidor.
*   **Decisão:** Utilizar Supabase Edge Functions (Runtime Deno).
*   **Consequências:**
    *   **Positivas:** Baixa latência (distribuição global), integração nativa com Auth e DB do Supabase, TypeScript nativo, segurança (segredos no servidor).
    *   **Negativas:** Limites de tempo de execução (timeout), ambiente runtime específico (Deno vs Node.js).
