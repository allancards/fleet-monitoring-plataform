# Architecture Decision Record (ADR) & System Design

**Versão:** 1.0.0  
**Última Atualização:** 2026-09-05  
**Responsável:** Time de Plataforma

---

## 1. Contexto e Objetivo

A Fleet Monitoring Platform foi projetada para receber, processar e armazenar grandes volumes de dados de telemetria veicular em tempo real. O principal desafio é manter baixa latência na ingestão de dados (API) enquanto realiza processamento pesado (persistência histórica e cálculos geoespaciais) sem bloquear o cliente.

Para atender a esse cenário, adotamos uma **arquitetura orientada a eventos (Event-Driven Architecture - EDA)** com desacoplamento via **Message Broker (RabbitMQ)**.

---

## 2. Diagrama de Contexto

┌─────────────────────┐ ┌─────────────────────────────────────────────────────┐
│ Ator │ │ Fleet Monitoring Platform │
│ (Sistema Embarcado)│ │ │
│ ou │───HTTP──▶│ [API Gateway] ──(Publica)──▶ [RabbitMQ] │
│ Front-End │ │ │ │ │
└─────────────────────┘ │ ▼ ▼ (Consome) │
│ Retorna 202 [Worker Telemetry] │
│ │
│ │ │ │
│ ▼ ▼ │
│ [PostgreSQL/PostGIS] [Redis Cache] │
│ (Histórico + Geo) (Estado Atual) │
└─────────────────────────────────────────────────────┘



---

## 3. Visão de Containers / Componentes

### 3.1. API Gateway (Fastify)
- **Responsabilidade:** Ponto de entrada da aplicação.
- **Validação:** Utiliza `Zod` para garantir a integridade dos dados antes de enfileirar.
- **Logs:** Logs estruturados em JSON via `Pino`.
- **Comportamento:** Publica a mensagem no RabbitMQ e retorna `202 Accepted` (assíncrono), nunca aguardando o processamento do Worker.

### 3.2. RabbitMQ (Broker)
- **Responsabilidade:** Desacoplamento e buffer de mensagens.
- **Fila:** `telemetry.raw.queue` (Durable: sobrevive a reinícios do broker).
- **Padrão:** Entrega "At-least-once" (garantia que a mensagem será processada ao menos uma vez) via **Acknowledge (ACK)** manual.
- **Prefetch:** Configurado como `1` para evitar sobrecarga em um único worker.

### 3.3. Worker-Telemetry (Consumer Node.js)
- **Responsabilidade:** Processamento assíncrono das mensagens.
- **Pipeline:**
  1. Consome mensagem da fila.
  2. Insere registro no PostgreSQL (com geometria `POINT` para lat/long).
  3. Atualiza o estado no Redis (chave `vehicle:{id}:latest` com TTL).
  4. Envia ACK ao RabbitMQ (remove a mensagem da fila).
  5. (Falha) Em caso de erro, envia NACK e a mensagem retorna à fila (retry).

### 3.4. PostgreSQL + PostGIS
- **Responsabilidade:** Armazenamento histórico e análise geoespacial.
- **Extensão:** PostGIS habilita queries como distâncias, polígonos (geofencing) e rotas.
- **Índices:** GIST para colunas de geometria, B-tree para `(vehicle_id, timestamp)`.

### 3.5. Redis
- **Responsabilidade:** Cache de baixa latência para o estado mais recente de cada veículo.
- **Estrutura:** String contendo JSON do último dado recebido.
- **TTL (Time-to-Live):** 3600 segundos (1 hora) para limpeza automática de veículos inativos.

---

## 4. Diagrama de Sequência Detalhado

Cliente Gateway RabbitMQ Worker PostgreSQL Redis
│ │ │ │ │ │
│──POST /telemetry▶ │ │ │ │
│ │ │ │ │ │
│ Valida payload │ │ │ │
│ │ │ │ │ │
│ publish()──────────▶│ │ │ │
│ │ │ (Enfileira) │ │ │
│◀───202 Accepted─│ │ │ │ │
│ │ │ │ │ │
│ │ │───Consume()────▶│ │ │
│ │ │ │ │ │
│ │ │ │───INSERT──────▶│ │
│ │ │ │ │ │
│ │ │ │─────SET────────┼────────────────▶│
│ │ │ │ │ │
│ │ │◀─────ACK────────│ │ │
│ │ │ │ │ │



---

## 5. Decisões Arquiteturais (Design Decisions)

| Decisão | Justificativa |
| :--- | :--- |
| **RabbitMQ vs. Kafka** | Escolhemos RabbitMQ por ser mais leve e atender perfeitamente à carga atual (milhares de msgs/s). O modelo de ACK manual e filas duráveis é mais simples de gerenciar que o particionamento do Kafka para este caso de uso. |
| **PostgreSQL + PostGIS** | Necessidade de consultas espaciais futuras (ex: "veículos em um raio de 5km"). O PostGIS é a extensão mais madura e confiável para isso no ecossistema SQL. |
| **Redis para estado atual** | O estado do veículo (velocidade, localização) precisa ser lido centenas de vezes por segundo pelo front-end (dashboard). O Redis entrega latência < 1ms, enquanto o PostgreSQL seria mais lento para essa carga de leitura intensa. |
| **Fastify vs. Express** | Fastify possui validação nativa (AJV/Zod) e melhor performance em benchmarks, além de logs estruturados com Pino, o que facilita a observabilidade. |
| **Zod para Validação** | Oferece tipagem estática inferida automaticamente (TypeScript-first), reduzindo bugs e melhorando a experiência do desenvolvedor. |
| **Variáveis de Ambiente com Zod** | Garantimos que o sistema não sobe se faltar alguma variável crítica (ex: `RABBITMQ_URL`), prevenindo falhas em produção. |

---

## 6. Estratégias de Resiliência e Falhas

1. **Falha no PostgreSQL:** O Worker falha ao inserir e envia NACK. A mensagem retorna à fila e será reprocessada após o banco se recuperar.
2. **Falha no Redis:** O Worker loga o erro, mas prossegue com o INSERT no PostgreSQL e dá ACK. A prioridade é não perder dados históricos.
3. **Falha no RabbitMQ:** As filas são Durable. Se o RabbitMQ cair, as mensagens persistem em disco. Ao reiniciar, o Worker continua de onde parou.
4. **Falha no Gateway:** Se o Gateway não conseguir conectar ao RabbitMQ, ele retorna erro 500 para o cliente (fail-fast), evitando dados perdidos.

---

## 7. Escalabilidade

- **Gateway:** Stateless. Pode ser escalado horizontalmente (ex: via Kubernetes/NGINX).
- **Worker:** Podemos rodar múltiplas instâncias do Worker-Telemtry consumindo da mesma fila. O RabbitMQ distribuirá as mensagens em round-robin entre eles.
- **Banco de Dados:** O PostgreSQL pode ser escalado com réplicas de leitura para dashboards, mantendo uma primária apenas para escritas do Worker.

