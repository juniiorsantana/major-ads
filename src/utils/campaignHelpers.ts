/**
 * Campaign Helpers — Utilitários para detecção e classificação de campanhas
 *
 * Centraliza a lógica de detecção de campanhas de mensagem (WhatsApp, Messenger, DM)
 * e extração de métricas específicas para esse tipo de campanha.
 *
 * [FIX] Agora utiliza campos reais retornados pelo backend:
 * - optimization_goal (ex: "CONVERSATIONS")
 * - messaging_conversations (extraído do actions do insights)
 */

import { Campaign } from '../types';

// ==========================================
// Palavras-chave para detecção por nome
// ==========================================

const MESSAGE_CAMPAIGN_KEYWORDS = [
    'mensagem',
    'whatsapp',
    'messenger',
    'dm',
    'direct',
    'message',
    'inbox',
    'chat',
] as const;

/**
 * Detecta se uma campanha é do tipo "mensagem" (WhatsApp, Messenger, DM).
 *
 * Regras de detecção (qualquer uma verdadeira):
 * 1. optimization_goal === "CONVERSATIONS" (campo real da Meta API)
 * 2. messaging_conversations > 0 (extraído do array actions do insights)
 * 3. objective é OUTCOME_ENGAGEMENT + nome sugere mensagem
 * 4. Nome da campanha contém palavras-chave de mensagem
 */
export function isMessageCampaign(campaign: Campaign): boolean {
    // Regra 1: optimization_goal direto da Meta API (mais confiável)
    if (campaign.optimization_goal === 'CONVERSATIONS') {
        return true;
    }

    // Regra 2: Tem conversas de messaging rastreadas nos insights
    if (
        campaign.messaging_conversations !== undefined &&
        campaign.messaging_conversations > 0
    ) {
        return true;
    }

    // Regra 3: Objetivo + nome sugere mensagem
    if (
        (campaign.objective === 'OUTCOME_LEADS' || campaign.objective === 'OUTCOME_ENGAGEMENT') &&
        hasMessageKeywordInName(campaign.name)
    ) {
        return true;
    }

    // Regra 4: Nome contém palavras-chave de mensagem (fallback)
    return hasMessageKeywordInName(campaign.name);
}

/**
 * Verifica se o nome da campanha contém palavras-chave de mensagem.
 */
function hasMessageKeywordInName(name: string): boolean {
    const lowerName = name.toLowerCase();
    return MESSAGE_CAMPAIGN_KEYWORDS.some((keyword) =>
        lowerName.includes(keyword)
    );
}

/**
 * Extrai o número de conversas iniciadas para campanhas de mensagem.
 *
 * Estratégia de fallback:
 * 1. Usa messaging_conversations (campo dedicado extraído do actions)
 * 2. Fallback para conversions (campo genérico)
 * 3. Retorna 0 se nenhum dado disponível
 */
export function getMessageConversations(campaign: Campaign): number {
    // Prioridade 1: Campo dedicado de messaging
    if (
        campaign.messaging_conversations !== undefined &&
        campaign.messaging_conversations !== null &&
        campaign.messaging_conversations > 0
    ) {
        return campaign.messaging_conversations;
    }

    // Prioridade 2: Fallback para conversions genérico
    if (campaign.conversions !== undefined && campaign.conversions !== null) {
        return campaign.conversions;
    }

    return 0;
}
