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


2.2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e ajuste os valores se necessário:
bash

cp .env.example .env

    Atenção: O arquivo .env já deve apontar para os serviços do Docker Compose.

2.3. Subir os Serviços com Docker
bash

docker-compose up -d


Isso iniciará:

    PostgreSQL na porta 5432

    Redis na porta 6379

    RabbitMQ na porta 5672 (AMQP) e 15672 (Management UI)

2.4. Instalar Dependências e Rodar

O projeto é um monorepo simples com dois serviços. Execute cada um em um terminal separado.

Terminal 1 (API Gateway):
bash

cd services/api-gateway
npm install
npm run dev
# Servidor rodando em http://localhost:3000

Terminal 2 (Worker-Telemetry):
bash

cd services/worker-telemetry
npm install
npm run dev
# Worker conectado e escutando a fila

3. Estrutura do Repositório (Monorepo)
text

services/
├── api-gateway/          # Serviço de entrada HTTP
│   ├── src/
│   │   ├── config/       # Configurações (ex: plugins Fastify)
│   │   ├── routes/       # Definição de endpoints (ex: telemetry.route.ts)
│   │   ├── schemas/      # Schemas Zod (ex: telemetry.schema.ts)
│   │   ├── services/     # Lógica de negócio (ex: rabbitmq.ts)
│   │   ├── ts_env.ts     # Validação de .env
│   │   └── server.ts     # Entrypoint
│   ├── package.json
│   └── tsconfig.json
└── worker-telemetry/     # Serviço de processamento
    ├── src/
    │   ├── config/       
    │   ├── db/           # Conexões (postgres.ts, redis.ts)
    │   ├── consumer.ts   # Lógica de consumo RabbitMQ
    │   ├── ts_env.ts     
    │   └── index.ts      # Entrypoint
    ├── package.json
    └── tsconfig.json


4. Fluxo de Trabalho (Workflow) - Git

Seguimos o padrão Git Flow simplificado:

    main → Código em produção (taggeado com versões).

    develop → Integração contínua (padrão para PRs).

    feature/nome-da-feature → Branch para novas funcionalidades.

Padrão de Commits (Conventional Commits):

    feat: nova funcionalidade.

    fix: correção de bug.

    chore: tarefas de manutenção (ex: dependências).

    docs: atualização de documentação.


5. Como Adicionar uma Nova Funcionalidade
5.1. Adicionar um Novo Campo na Telemetria

    Altere o schema Zod em api-gateway/src/schemas/telemetry.schema.ts.

    Altere a query de INSERT no worker-telemetry/src/consumer.ts (e a estrutura da tabela via migration SQL).

    Atualize a especificação (specification.md) e o .env.example se necessário.

5.2. Criar um Novo Endpoint

    Crie um arquivo de rota em api-gateway/src/routes/.

    Defina o schema de validação.

    Implemente o handler (ex: publicar em uma nova fila).

    Registre a rota no server.ts.

    Teste com curl ou Postman.


5.3. Criar um Novo Worker (ex: Worker-Alerts)

    Duplique a pasta worker-telemetry e renomeie.

    Altere o arquivo package.json (name, scripts).

    Modifique o consumer.ts para escutar uma fila específica (ex: telemetry.processed.queue).

    Adicione a lógica de negócio (ex: enviar alertas).

    Atualize o docker-compose.yml se necessário.

