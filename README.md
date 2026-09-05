# Fleet Monitoring Platform

Uma plataforma completa de monitoramento de frotas veiculares em tempo real, baseada em arquitetura orientada a eventos (Event-Driven). O sistema recebe dados de telemetria via API REST, processa de forma assíncrona com RabbitMQ, persiste histórico geoespacial no PostgreSQL/PostGIS, mantém estado atual em Redis, e fornece atualizações instantâneas para o frontend via WebSockets.

---

## 🎯 Principais Funcionalidades

- ✅ **Recepção de telemetria** via API Gateway (Fastify) com validação Zod.
- ✅ **Processamento assíncrono** com RabbitMQ – baixo acoplamento e alta resiliência.
- ✅ **Persistência histórica** no PostgreSQL com extensão PostGIS (consultas espaciais).
- ✅ **Cache de estado atual** no Redis para consultas rápidas (última posição de cada veículo).
- ✅ **Alertas em tempo real** – detecção de excesso de velocidade (>100 km/h) com notificações instantâneas.
- ✅ **Frontend interativo** – mapa Leaflet com marcadores atualizados via WebSocket (Socket.IO).
- ✅ **Simulador de frota** – gera dados contínuos para testes sem necessidade de dispositivos reais.
- ✅ **Arquitetura escalável** – workers podem ser replicados horizontalmente.

---

## 🏗️ Arquitetura do Sistema

[Frontend React + Leaflet] ←── WebSocket (Socket.IO) ←── [Worker-Alerts]
▲ ▲
│ │
│ (atualizações via Redis Pub/Sub) │
│ │
[Simulador] ──HTTP POST──▶ [API Gateway (Fastify)] ──publica──▶ [RabbitMQ]
│ (fila: telemetry.raw)
▼
[Worker-Telemetry]
│
├──▶ [PostgreSQL/PostGIS] (histórico)
└──▶ [Redis] (estado atual)


**Fluxo de dados:**

1. **Simulador** (ou dispositivos reais) envia telemetria para o Gateway via `POST /api/v1/telemetry`.
2. **Gateway** valida o payload e publica no RabbitMQ (exchange `fleet.events`, routing key `telemetry.raw`).
3. **Worker-Telemetry** consome a fila, salva o histórico no PostgreSQL e atualiza o estado no Redis.
4. **Worker-Telemetry** publica a atualização no Redis Pub/Sub (canal `vehicle.update`).
5. **Worker-Alerts** recebe a atualização via Redis Pub/Sub, processa regras (ex: velocidade > 100) e emite alertas via WebSocket.
6. **Frontend** conecta-se ao Worker-Alerts via Socket.IO e recebe atualizações de posição e alertas em tempo real.

---

## 🛠️ Tecnologias Utilizadas

| Camada                | Tecnologia                                    |
|-----------------------|-----------------------------------------------|
| **API Gateway**       | Fastify + TypeScript + Zod                    |
| **Mensageria**        | RabbitMQ (amqplib)                            |
| **Banco de Dados**    | PostgreSQL + PostGIS                          |
| **Cache / Estado**    | Redis                                         |
| **Workers**           | Node.js + TypeScript (Worker-Telemetry, Worker-Alerts) |
| **WebSocket**         | Socket.IO (servidor e cliente)                |
| **Frontend**          | React + Vite + TypeScript + Leaflet           |
| **Simulador**         | Node.js + TypeScript (axios)                  |
| **Orquestração**      | Docker Compose                                |
| **Logs**              | Pino (no Gateway)                             |

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- Git

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/allancards/fleet-monitoring-platform.git
   cd fleet-monitoring-platform
   ```
2. Configure as variáveis de ambiente:
    ```bash

    cp .env.example .env
    # Edite o .env se necessário (valores padrão já funcionam com o docker-compose)
    ```
3. Suba a infraestrutura com Docker:
    ```bash

    docker-compose up -d

    Isso iniciará PostgreSQL/PostGIS, Redis e RabbitMQ.
    ```
4. Instale as dependências de cada serviço (em terminais separados):

  - API Gateway:
    ```bash

    cd services/api-gateway
    npm install
    npm run dev
    ```
  - Worker-Telemetry:
    ```bash

    cd services/worker-telemetry
    npm install
    npm run dev
    ```

  - Worker-Alerts:
    ```bash

    cd services/worker-alerts
    npm install
    npm run dev
    ```

  - Frontend:
    ```bash

    cd services/frontend-web
    npm install
    npm run dev
    ```

    Simulador (opcional, para gerar dados de teste):
    ```bash

    cd tools/simulator
    npm install
    npm run dev
    ```


5. Acesse a aplicação:

        Frontend: http://localhost:3002

        API Gateway: http://localhost:3000

        RabbitMQ Management: http://localhost:15672 (credenciais: fleet_admin / fleet_password)

        PostgreSQL: localhost:5432 (database fleet_db, user fleet_user, password fleet_password)

        📡 Endpoints da API
        Método	Rota	Descrição
        POST	/api/v1/telemetry	Envia dados de telemetria de um veículo
        GET	/health	Verifica status do Gateway

        Exemplo de requisição POST
        ```bash

        curl -X POST http://localhost:3000/api/v1/telemetry \
          -H "Content-Type: application/json" \
          -d '{
            "vehicleId": "veh-001",
            "latitude": -23.55052,
            "longitude": -46.633308,
            "speed": 85.5,
            "ignition": true,
            "timestamp": "2026-09-04T12:00:00.000Z"
          }'
          ```

        Resposta (202 Accepted)
        ```json

        {
          "status": "accepted",
          "message": "Evento de telemetria recebido e enfileirado para processamento.",
          "receivedAt": "2026-09-05T02:08:18.194Z"
        }
        ```

🗄️ Estrutura do Banco de Dados
- Tabela vehicles

Coluna	    Tipo	            Descrição
id	      VARCHAR(36) PK	    Identificador do veículo
plate	    VARCHAR(20)	        Placa
model	    VARCHAR(100)	      Modelo
status	   VARCHAR(20)	  ACTIVE / INACTIVE
created_at	TIMESTAMPTZ	    Data de cadastro


- Tabela telemetry_history
Coluna	        Tipo	                    Descrição
id	          BIGSERIAL PK	              Identificador único
vehicle_id	  VARCHAR(36) FK (vehicles)	   Veículo associado
latitude	    DOUBLE PRECISION	          Latitude do ponto
longitude	    DOUBLE PRECISION	          Longitude do ponto
location	    GEOMETRY(Point, 4326)	      Ponto geográfico (PostGIS)
speed	        DOUBLE PRECISION	           Velocidade em km/h
ignition	    BOOLEAN	                    Estado da ignição
timestamp	    TIMESTAMPTZ	                Data/hora do evento
created_at	  TIMESTAMPTZ	                Data de inserção

Índices:

    idx_telemetry_location (GIST) para consultas espaciais.

    idx_telemetry_vehicle_time (vehicle_id, timestamp DESC) para consultas por veículo/período.

- Tabela fleet_alerts
Coluna	        Tipo	            Descrição
id	          BIGSERIAL PK	      Identificador único
vehicle_id	  VARCHAR(36) FK	    Veículo associado
type	        VARCHAR(50)	        Tipo de alerta (ex: SPEED_LIMIT)
severity	    VARCHAR(20)	        INFO / WARNING / CRITICAL
message	        TEXT	            Mensagem descritiva
payload	      JSONB	              Dados adicionais (opcional)
timestamp	    TIMESTAMPTZ	        Data/hora do evento
created_at	  TIMESTAMPTZ	          Data de inserção


🔌 WebSocket (Socket.IO)

O Worker-Alerts expõe um servidor Socket.IO na porta 3001.
Eventos emitidos pelo servidor:

    vehicle-update – atualização de posição de um veículo (enviado sempre que o Redis recebe uma nova telemetria).

    alert – disparado quando uma regra de alerta é violada (ex: velocidade > 100 km/h).

Eventos que o cliente pode enviar:

    subscribe-vehicle – inscreve-se para receber atualizações apenas de um veículo específico (ex: socket.emit('subscribe-vehicle', 'veh-001')).


📁 Estrutura do Projeto (Monorepo)

fleet-monitoring-platform/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
│
├── services/
│   ├── api-gateway/          # Fastify + Zod + RabbitMQ publisher
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── worker-telemetry/     # Consome fila, salva no PostgreSQL e Redis
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── db/
│   │   │   ├── consumer.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── worker-alerts/        # WebSocket (Socket.IO) + Redis Pub/Sub + regras
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── redis/
│   │   │   ├── websocket/
│   │   │   ├── rules/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend-web/         # React + Vite + Leaflet + Socket.IO
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── types/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
│
├── tools/
│   └── simulator/            # Gera dados de telemetria automaticamente
│       ├── src/
│       │   ├── config.ts
│       │   ├── vehicle.ts
│       │   ├── sender.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
└── scripts/
    └── init.sql              # Script de inicialização do banco


🧪 Testando o Sistema Completo

    Suba todos os serviços (Docker, Gateway, Workers, Frontend, Simulador) conforme instruções acima.

    Acesse http://localhost:3002 no navegador – você verá o mapa com os veículos se movendo e o painel de alertas.

    Observe os alertas de excesso de velocidade no painel e no console do Worker-Alerts.

    Verifique os dados no PostgreSQL e no Redis:

        docker exec -it fleet_postgres psql -U fleet_user -d fleet_db -c "SELECT * FROM telemetry_history ORDER BY id DESC LIMIT 5;"

        docker exec -it fleet_redis redis-cli GET vehicle:veh-001:state


🔧 Variáveis de Ambiente

Crie um arquivo .env na raiz (ou copie de .env.example) com as seguintes variáveis:
env

# API Gateway
GATEWAY_PORT=3000
GATEWAY_HOST=0.0.0.0

# RabbitMQ
RABBITMQ_URL=amqp://fleet_admin:fleet_password@localhost:5672

# PostgreSQL
DATABASE_URL=postgresql://fleet_user:fleet_password@localhost:5432/fleet_db

# Redis
REDIS_URL=redis://localhost:6379

# Worker-Alerts
WS_PORT=3001

# Frontend (opcional, usado no .env do frontend)
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3000

📈 Próximos Passos (Sugestões)

    [  ] Autenticação JWT – proteger o Gateway e o WebSocket.

    [  ] Geofencing – criar áreas virtuais e alertar quando veículos saírem delas.

    [  ] Dashboard com métricas – gráficos de velocidade média, distância percorrida, etc.

    [  ] Deploy – em nuvem (AWS, Azure, ou VPS) com Docker Compose ou Kubernetes.


🤝 Contribuição

Sinta-se à vontade para abrir issues ou pull requests para melhorias. Consulte o guia de desenvolvimento (se existir) para detalhes.
📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais informações.

Desenvolvido por [Allan] – [LinkedIn](https://www.linkedin.com/in/allan-cardoso-developer/) | [Github](https://github.com/allancards)