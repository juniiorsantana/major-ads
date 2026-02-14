# Objetivos de Campanha - Meta Marketing API v21

## Resumo
Sim, é possível definir o objetivo da campanha através da Meta Marketing API usando o parâmetro `objective` ao criar uma campanha.

**✅ IMPORTANTE - Você está usando API v21**: A partir da versão 21 (lançada em outubro de 2024), a Meta descontinuou completamente os objetivos legados e agora usa **apenas os objetivos simplificados OUTCOME_***.

## Endpoint Principal
```
POST https://graph.facebook.com/v21.0/{ad_account_id}/campaigns
```

## Parâmetro: `objective`

O campo `objective` define o objetivo da campanha. Com base na imagem fornecida, aqui estão os valores correspondentes:

### ✅ Objetivos Simplificados (API v21) - OBRIGATÓRIOS

| Objetivo (Interface) | Valor API | Descrição |
|---------------------|-----------|-----------|
| **Reconhecimento** | `OUTCOME_AWARENESS` | Aumentar o conhecimento da marca |
| **Tráfego** | `OUTCOME_TRAFFIC` | Direcionar pessoas para destinos (site, app, etc) |
| **Interação** | `OUTCOME_ENGAGEMENT` | Obter mais mensagens, visualizações de vídeo, curtidas, etc |
| **Leads** | `OUTCOME_LEADS` | Coletar leads para o negócio |
| **Promoção de app** | `OUTCOME_APP_PROMOTION` | Obter mais instalações ou interações no app |
| **Vendas** | `OUTCOME_SALES` | Incentivar pessoas a comprar produtos/serviços |

## Exemplo de Criação de Campanha (API v21)

```bash
curl -X POST \
  "https://graph.facebook.com/v21.0/{ad_account_id}/campaigns" \
  -d "name=Minha Campanha de Tráfego" \
  -d "objective=OUTCOME_TRAFFIC" \
  -d "status=PAUSED" \
  -d "special_ad_categories=[]" \
  -d "access_token={access_token}"
```

## Exemplo em Python

```python
import requests

# Configurações
ad_account_id = "act_123456789"
access_token = "SEU_ACCESS_TOKEN"

# Dados da campanha
campaign_data = {
    "name": "Campanha de Leads - Fevereiro 2026",
    "objective": "OUTCOME_LEADS",
    "status": "PAUSED",
    "special_ad_categories": [],
    "access_token": access_token
}

# Criar campanha
url = f"https://graph.facebook.com/v21.0/{ad_account_id}/campaigns"
response = requests.post(url, data=campaign_data)

print(response.json())
```

## Exemplo em JavaScript/Node.js

```javascript
const axios = require('axios');

const adAccountId = 'act_123456789';
const accessToken = 'SEU_ACCESS_TOKEN';

const campaignData = {
  name: 'Campanha de Vendas - Black Friday',
  objective: 'OUTCOME_SALES',
  status: 'PAUSED',
  special_ad_categories: [],
  access_token: accessToken
};

axios.post(
  `https://graph.facebook.com/v21.0/${adAccountId}/campaigns`,
  campaignData
)
.then(response => {
  console.log('Campanha criada:', response.data);
})
.catch(error => {
  console.error('Erro:', error.response.data);
});
```

## Mapeamento de Objetivos - API v21

### ⚠️ IMPORTANTE: Objetivos Legados DESCONTINUADOS na v21

A partir da **API v21** (outubro 2024), os objetivos legados foram **completamente removidos**. Você **NÃO PODE MAIS** usar:

- ❌ `BRAND_AWARENESS`
- ❌ `REACH`
- ❌ `LINK_CLICKS`
- ❌ `POST_ENGAGEMENT`
- ❌ `VIDEO_VIEWS`
- ❌ `MESSAGES`
- ❌ `CONVERSIONS`
- ❌ `LEAD_GENERATION`
- ❌ `APP_INSTALLS`
- ❌ `PRODUCT_CATALOG_SALES`

### ✅ Use APENAS os Objetivos Simplificados OUTCOME_*

- `OUTCOME_AWARENESS` - Reconhecimento
- `OUTCOME_TRAFFIC` - Tráfego
- `OUTCOME_ENGAGEMENT` - Interação
- `OUTCOME_LEADS` - Leads
- `OUTCOME_APP_PROMOTION` - Promoção de app
- `OUTCOME_SALES` - Vendas

**Migração**: Se você ainda tem campanhas com objetivos legados, elas continuarão rodando, mas você **NÃO PODE** criar novos ad sets ou ads nessas campanhas na v21.

## Obter Campanhas Existentes

Para verificar campanhas existentes e seus objetivos:

```bash
curl -G \
  "https://graph.facebook.com/v21.0/{ad_account_id}/campaigns" \
  -d "fields=id,name,objective,status" \
  -d "access_token={access_token}"
```

## Atualizar Objetivo de Campanha

**⚠️ IMPORTANTE:** O objetivo de uma campanha **NÃO PODE** ser alterado depois que ela é criada. Você precisará criar uma nova campanha com o objetivo desejado.

## Permissões Necessárias

Certifique-se de que seu app tem as seguintes permissões:
- `ads_management` - Gerenciar anúncios
- `ads_read` - Ler dados de anúncios (opcional, para consultas)

## Documentação Oficial

- **Marketing API Reference**: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign
- **Campaign Objectives**: https://developers.facebook.com/docs/marketing-api/buying-api/campaigns
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/
- **Changelog v21.0**: https://developers.facebook.com/docs/graph-api/changelog/version21.0

## Notas Importantes para API v21

1. **Objetivos Simplificados Obrigatórios**: A Meta agora usa APENAS objetivos OUTCOME_*. Os objetivos legados não funcionam mais.

2. **Framework ODAX**: A v21 implementa completamente o framework ODAX (Outcome-Driven Ad Experiences) para simplificar a criação de campanhas.

3. **Imutabilidade**: O campo `objective` não pode ser modificado após a criação da campanha.

4. **Validação**: Nem todos os objetivos funcionam com todos os tipos de otimização no nível do conjunto de anúncios. Consulte a documentação para combinações válidas.

5. **Special Ad Categories**: Para campanhas relacionadas a crédito, emprego, habitação ou questões sociais, você deve declarar isso no parâmetro `special_ad_categories`.

6. **Campanhas Legadas**: Campanhas existentes com objetivos antigos continuam rodando, mas você NÃO pode criar novos ad sets ou ads nelas usando v21.

## Exemplo Completo - App em Node.js (API v21)

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Criar campanha
app.post('/api/campaigns', async (req, res) => {
  try {
    const { name, objective, adAccountId, accessToken } = req.body;
    
    // Validar objetivo - APENAS objetivos simplificados OUTCOME_* na v21
    const validObjectives = [
      'OUTCOME_AWARENESS',
      'OUTCOME_TRAFFIC',
      'OUTCOME_ENGAGEMENT',
      'OUTCOME_LEADS',
      'OUTCOME_APP_PROMOTION',
      'OUTCOME_SALES'
    ];
    
    if (!validObjectives.includes(objective)) {
      return res.status(400).json({
        error: 'Objetivo inválido para API v21',
        message: 'Use apenas objetivos OUTCOME_*',
        validObjectives
      });
    }
    
    // Criar campanha na Meta API v21
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${adAccountId}/campaigns`,
      {
        name,
        objective,
        status: 'PAUSED',
        special_ad_categories: [],
        access_token: accessToken
      }
    );
    
    res.json({
      success: true,
      campaignId: response.data.id,
      message: 'Campanha criada com sucesso usando API v21'
    });
    
  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message
    });
  }
});

// Listar campanhas
app.get('/api/campaigns', async (req, res) => {
  try {
    const { adAccountId, accessToken } = req.query;
    
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${adAccountId}/campaigns`,
      {
        params: {
          fields: 'id,name,objective,status,created_time',
          access_token: accessToken
        }
      }
    );
    
    res.json(response.data);
    
  } catch (error) {
    res.status(500).json({
      error: error.response?.data || error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000 - API v21');
});
```

## Dicas de Implementação para API v21

1. **Sempre crie campanhas pausadas** (`status: 'PAUSED'`) inicialmente
2. **Use APENAS objetivos OUTCOME_*** - objetivos legados não funcionam na v21
3. **Valide os objetivos** antes de enviar para a API
4. **Trate erros adequadamente** - a API da Meta retorna mensagens detalhadas
5. **Use a versão v21 ou superior** da Graph API
6. **Implemente retry logic** para requisições que podem falhar temporariamente
7. **Migre campanhas antigas** - se ainda tem campanhas com objetivos legados, crie novas com OUTCOME_*
8. **Configure tracking adequado** - Pixel e Conversions API (CAPI) são essenciais para performance
9. **Teste com campanhas pausadas** primeiro antes de ativar

## Diferenças Principais da v21 vs Versões Anteriores

### O que mudou na v21:
- ✅ Objetivos simplificados OUTCOME_* obrigatórios
- ❌ Objetivos legados completamente removidos para novas campanhas
- ✅ Framework ODAX totalmente implementado
- ❌ Não é possível criar novos ad sets/ads em campanhas com objetivos legados
- ✅ Melhor integração com automação Advantage+

### Compatibilidade:
- **Campanhas existentes**: continuam funcionando
- **Novos ad sets em campanhas antigas**: ❌ não permitido na v21
- **Novas campanhas**: devem usar OUTCOME_* obrigatoriamente
