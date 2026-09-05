# Especificação Técnica do Sistema

**Versão:** 1.0.0  
**Status:** Em Desenvolvimento (MVP)  
**Última Atualização:** 2026-09-05

---

## 1. Requisitos Funcionais (RF)

| ID | Descrição | Prioridade |
| :--- | :--- | :--- |
| **RF-01** | O sistema deve receber dados de telemetria via requisição HTTP POST. | Alta |
| **RF-02** | A API deve validar a estrutura e os tipos dos dados recebidos. | Alta |
| **RF-03** | O sistema deve processar a telemetria de forma assíncrona, retornando imediatamente um status de aceitação (202) para o cliente. | Alta |
| **RF-04** | O sistema deve persistir todos os dados históricos de telemetria em um banco de dados relacional com suporte geoespacial. | Alta |
| **RF-05** | O sistema deve manter em cache (Redis) o estado mais recente de cada veículo para consultas rápidas. | Média |
| **RF-06** | O sistema deve garantir que nenhuma mensagem seja perdida em caso de falha do Worker (at-least-once delivery). | Alta |

---

## 2. Requisitos Não Funcionais (RNF)

| ID | Descrição | Métrica |
| :--- | :--- | :--- |
| **RNF-01** | A API deve ter baixa latência, sem bloquear o cliente. | Resposta em < 50ms (p95). |
| **RNF-02** | O sistema deve ser tolerante a falhas parciais (ex: banco de dados indisponível). | Mensagens devem permanecer na fila até recuperação. |
| **RNF-03** | O sistema deve ser escalável horizontalmente. | Suporte a múltiplas instâncias do Worker. |
| **RNF-04** | Logs devem ser estruturados em formato JSON. | Integração facilitada com ferramentas de observabilidade (ELK/Datadog). |
| **RNF-05** | O código deve ser escrito em TypeScript com tipagem estrita (`strict: true`). | Redução de erros em produção. |

---

## 3. Especificação da API (REST)

### 3.1. Endpoint: `POST /api/v1/telemetry`

**Descrição:** Envia um evento de telemetria de um veículo.

**Headers:**
- `Content-Type: application/json`

**Request Body (JSON):**

| Campo | Tipo | Obrigatório | Descrição | Validação |
| :--- | :--- | :--- | :--- | :--- |
| `vehicleId` | `string` | Sim | Identificador único do veículo. | Máx. 50 caracteres. |
| `latitude` | `number` | Sim | Coordenada geográfica (WGS-84). | Entre -90 e 90. |
| `longitude` | `number` | Sim | Coordenada geográfica (WGS-84). | Entre -180 e 180. |
| `speed` | `number` | Sim | Velocidade em km/h. | Deve ser >= 0. |
| `ignition` | `boolean` | Sim | Estado da ignição (true = ligada). | - |
| `timestamp` | `string` (ISO 8601) | Sim | Data/hora do evento. | Deve ser uma data válida no passado ou presente. |

**Exemplo de Request:**
```json
{
  "vehicleId": "veh-001",
  "latitude": -23.55052,
  "longitude": -46.633308,
  "speed": 85.5,
  "ignition": true,
  "timestamp": "2026-09-04T12:00:00.000Z"
}

Resposta de Sucesso (202 Accepted):
json

{
  "status": "accepted",
  "message": "Evento de telemetria recebido e enfileirado para processamento.",
  "receivedAt": "2026-09-05T02:08:18.194Z"
}

Resposta de Erro (400 Bad Request):
json

{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body/speed must be >= 0"
}

--- 

4. Especificação dos Dados (Schemas)

4.1. PostgreSQL (Tabela telemetry)
sql

CREATE TABLE IF NOT EXISTS public.telemetry (
    id SERIAL PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    speed DECIMAL(10, 2) NOT NULL,
    ignition BOOLEAN NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_vehicle_time ON public.telemetry (vehicle_id, timestamp DESC);
CREATE INDEX idx_location_gist ON public.telemetry USING GIST (location);


4.2. Redis (Cache)

    Padrão de Chave: vehicle:{vehicleId}:latest

    Valor: JSON string com os mesmos campos do payload.

    TTL (Expiração): EX 3600 (1 hora).
    
    
    
5. Especificação da Mensageria (RabbitMQ)

    Exchange: (Default / Direct) (não utilizado explicitamente, publicamos diretamente na fila).

    Queue Name: telemetry.raw.queue

    Durable: true (persiste em disco).

    Auto-delete: false (mantém a fila mesmo sem consumidores).

    Prefetch Count: 1 (processa uma mensagem por vez para balanceamento justo).

    Ack Mode: Manual (channel.ack() somente após sucesso no PostgreSQL).


6. Especificação de Ambiente (.env)
Variável	       Descrição	                Exemplo
HOST	        Host do servidor HTTP.	        0.0.0.0
PORT	        Porta do servidor HTTP.	          3000
RABBITMQ_URL	URL de conexão com o RabbitMQ.	amqp://rabbitmq:5672
POSTGRES_URL	URL de conexão com PostgreSQL.	postgresql://user:pass@postgres:5432/fleet
REDIS_URL	     URL de conexão com Redis.	    redis://redis:6379


---

## 📄 docs/development.md

```markdown
# Guia de Desenvolvimento

**Versão:** 1.0.0  
**Última Atualização:** 2026-09-05

Este guia descreve como configurar o ambiente, executar o projeto localmente, aplicar boas práticas e contribuir com a Fleet Monitoring Platform.

---

## 1. Pré-requisitos

- **Node.js:** v18.x ou superior (recomendamos o LTS).
- **npm:** v9.x ou superior.
- **Docker & Docker Compose:** Para subir os serviços dependentes (RabbitMQ, PostgreSQL, Redis).
- **Git:** Para controle de versão.
- **(Opcional)** **Postman/Insomnia:** Para testar a API.

---

## 2. Configuração Inicial do Projeto

### 2.1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/fleet-monitoring-platform.git
cd fleet-monitoring-platform