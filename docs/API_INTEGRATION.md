# LegacyPay - Documentação de Integração via API

## Visão Geral

A API de Integração da LegacyPay permite que sistemas externos (bots, automações, aplicações) gerem cobranças PIX de forma programática utilizando as credenciais da sua integração.

---

## Autenticação

A API utiliza **Basic Authentication** com as credenciais da integração:

- **Client ID**: Identificador único da integração
- **Client Secret**: Chave secreta para autenticação

### Formato do Header

```
Authorization: Basic {base64(client_id:client_secret)}
```

### Exemplo em Node.js

```javascript
const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const headers = {
  'Authorization': `Basic ${credentials}`,
  'Content-Type': 'application/json'
};
```

### Exemplo em Python

```python
import base64

credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
headers = {
    "Authorization": f"Basic {credentials}",
    "Content-Type": "application/json"
}
```

---

## Endpoints

### Base URL

```
https://legacypay.site/api/v1/integration
```

---

## 1. Criar Cobrança PIX

Gera um QR Code PIX para recebimento.

### Request

```
POST /api/v1/integration/pix
```

### Body (JSON)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `amount` | number | Sim | Valor em reais (ex: 10.50) |
| `external_id` | string | Não | ID externo para controle (gerado automaticamente se não informado) |
| `description` | string | Não | Descrição da cobrança |
| `payer` | object | Não | Dados do pagador |
| `payer.name` | string | Não | Nome do pagador |
| `payer.document` | string | Não | CPF/CNPJ do pagador |
| `payer.email` | string | Não | Email do pagador |

### Exemplo de Request

```json
{
  "amount": 4,
  "external_id": "pedido_12345",
  "description": "Acesso VIP",
  "payer": {
    "name": "João Silva",
    "document": "12345678900",
    "email": "joao@email.com"
  }
}
```

### Exemplo Mínimo (Apenas valor)

```json
{
  "amount": 10
}
```

### Response de Sucesso (200)

```json
{
  "success": true,
  "data": {
    "transaction_id": "9adcc783-4519-43cc-9d26-f7d01d4ab2e5",
    "external_id": "pedido_12345",
    "amount": 4,
    "fee": 1.5,
    "net_amount": 2.5,
    "status": "pending",
    "pix": {
      "qr_code": "00020126580014br.gov.bcb.pix...",
      "qr_code_base64": "data:image/png;base64,iVBORw0KGgo...",
      "copy_paste": "00020126580014br.gov.bcb.pix..."
    },
    "expires_at": "2025-01-15T15:30:00.000Z",
    "created_at": "2025-01-15T15:00:00.000Z"
  }
}
```

---

## 2. Consultar Status de Transação

Consulta o status atual de uma transação.

### Request

```
GET /api/v1/integration/pix?transaction_id={id}
```

ou

```
GET /api/v1/integration/pix?external_id={external_id}
```

### Response de Sucesso (200)

```json
{
  "success": true,
  "data": {
    "transaction_id": "9adcc783-4519-43cc-9d26-f7d01d4ab2e5",
    "external_id": "pedido_12345",
    "amount": 4,
    "fee": 1.5,
    "net_amount": 2.5,
    "status": "completed",
    "description": "Acesso VIP",
    "payer": {
      "name": "João Silva",
      "document": "12345678900"
    },
    "created_at": "2025-01-15T15:00:00.000Z",
    "updated_at": "2025-01-15T15:05:00.000Z"
  }
}
```

---

## Status das Transações

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando pagamento |
| `completed` | Pagamento confirmado |
| `failed` | Falha no pagamento |
| `expired` | PIX expirado |
| `cancelled` | Cancelado |
| `refunded` | Estornado |

---

## Códigos de Erro

| Código | HTTP | Descrição |
|--------|------|-----------|
| `UNAUTHORIZED` | 401 | Credenciais não fornecidas |
| `INVALID_CREDENTIALS` | 401 | Client ID ou Secret inválidos |
| `INTEGRATION_DISABLED` | 403 | Integração desativada |
| `ACCOUNT_DISABLED` | 403 | Conta do usuário desativada |
| `KYC_REQUIRED` | 403 | KYC não aprovado |
| `INVALID_AMOUNT` | 400 | Valor inválido |
| `MIN_AMOUNT` | 400 | Valor mínimo é R$ 1,00 |
| `MAX_AMOUNT` | 400 | Valor máximo é R$ 50.000,00 |
| `NOT_FOUND` | 404 | Transação não encontrada |
| `ACQUIRER_ERROR` | 500 | Erro no processador de pagamento |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor |

### Exemplo de Erro

```json
{
  "success": false,
  "error": "Valor mínimo é R$ 1,00",
  "code": "MIN_AMOUNT"
}
```

---

## Webhooks

Quando o pagamento for confirmado, um webhook será enviado para a URL configurada na integração.

### Payload do Webhook

```json
{
  "event": "payment.confirmed",
  "data": {
    "transaction_id": "9adcc783-4519-43cc-9d26-f7d01d4ab2e5",
    "external_id": "pedido_12345",
    "amount": 4,
    "fee": 1.5,
    "net_amount": 2.5,
    "status": "completed",
    "paid_at": "2025-01-15T15:05:00.000Z"
  }
}
```

---

## Exemplos de Integração

### Node.js (Bot Discord/Telegram)

```javascript
const axios = require('axios');

const CLIENT_ID = 'lp_8d27e9433c67408cb6b2e71a';
const CLIENT_SECRET = 'sk_09b8449b7104aca8ad6ea48a9254e2512f2f73e8265a66b9a50b8322bd1bd0d6';

async function criarPix(amount, description, externalId) {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  try {
    const response = await axios.post(
      'https://legacypay.site/api/v1/integration/pix',
      {
        amount: amount,
        description: description,
        external_id: externalId
      },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      const { transaction_id, pix } = response.data.data;
      console.log('PIX criado com sucesso!');
      console.log('Transaction ID:', transaction_id);
      console.log('Copia e Cola:', pix.copy_paste);
      return response.data.data;
    }
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
    throw error;
  }
}

// Uso
criarPix(10, 'Compra de créditos', 'pedido_001');
```

### Python (Bot)

```python
import requests
import base64

CLIENT_ID = "lp_8d27e9433c67408cb6b2e71a"
CLIENT_SECRET = "sk_09b8449b7104aca8ad6ea48a9254e2512f2f73e8265a66b9a50b8322bd1bd0d6"

def criar_pix(amount, description=None, external_id=None):
    credentials = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    
    headers = {
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "amount": amount
    }
    
    if description:
        payload["description"] = description
    if external_id:
        payload["external_id"] = external_id
    
    response = requests.post(
        "https://legacypay.site/api/v1/integration/pix",
        json=payload,
        headers=headers
    )
    
    data = response.json()
    
    if data.get("success"):
        print("PIX criado com sucesso!")
        print(f"Transaction ID: {data['data']['transaction_id']}")
        print(f"Copia e Cola: {data['data']['pix']['copy_paste']}")
        return data["data"]
    else:
        print(f"Erro: {data.get('error')} ({data.get('code')})")
        return None

# Uso
criar_pix(10, "Compra de créditos", "pedido_001")
```

### cURL

```bash
curl -X POST https://legacypay.site/api/v1/integration/pix \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "description": "Teste de pagamento",
    "external_id": "teste_001"
  }'
```

---

## Limites e Restrições

| Item | Valor |
|------|-------|
| Valor mínimo | R$ 1,00 |
| Valor máximo | R$ 50.000,00 |
| Validade do PIX | 30 minutos |
| Rate limit | 60 requisições/minuto |

---

## Checklist de Integração

1. [ ] Obter Client ID e Client Secret no painel da LegacyPay
2. [ ] Configurar URL de webhook (opcional, mas recomendado)
3. [ ] Implementar autenticação Basic Auth
4. [ ] Testar criação de PIX com valor mínimo
5. [ ] Implementar tratamento de erros
6. [ ] Configurar recebimento de webhooks
7. [ ] Testar fluxo completo: criação -> pagamento -> confirmação

---

## Suporte

Em caso de dúvidas ou problemas técnicos, entre em contato através do painel da LegacyPay ou pelo suporte dedicado.
