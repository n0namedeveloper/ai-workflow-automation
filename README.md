# AI-Powered Workflow Automation

AI platform for workflow automation: a fast LLM microservice (FastAPI + Gemini), n8n pipelines, tRPC backend, and a React dashboard for managing workflows and analytics.

## Architecture

The project consists of four main services orchestrated via `docker-compose`.

| Service      | Port | Description                                 |
|-------------|------|---------------------------------------------|
| Main App    | 3000 | React + tRPC + Hono API (frontend + API)    |
| LLM Service | 8000 | FastAPI microservice → Gemini API           |
| n8n         | 5678 | UI for building and running workflows       |
| MySQL       | 3306 | Storage for users and pipelines             |

### Project Structure

```text
ai-workflow-automation/
├── api/                          # tRPC Backend
│   ├── router.ts                 # Router registration
│   ├── workflow-router.ts        # CRUD workflows + pipeline runs + stats
│   └── middleware.ts             # Auth, procedures
├── contracts/                    # Shared types
├── db/
│   ├── schema.ts                 # users, workflows, pipeline_runs, api_configs, classification_results
│   └── seed.ts                   # Demo data
├── llm-service/                  # FastAPI microservice
│   ├── main.py                   # REST API (/classify, /extract, /route, /process)
│   ├── Dockerfile                # Python 3.11 container
│   ├── requirements.txt          # Dependencies
│   └── .env.example
├── n8n-workflows/                # Ready-to-use n8n pipelines
│   ├── classification-pipeline.json
│   ├── data-extraction-pipeline.json
│   └── routing-pipeline.json
├── src/
│   ├── pages/                    # Dashboard, Workflows, PipelineRuns, Settings
│   ├── components/               # AppLayout with Sidebar
│   └── App.tsx                   # Routing
├── docker-compose.yml            # All 4 services
├── Dockerfile                    # Main application
└── README.md                     # Documentation
```

## Key Features

- **Fast LLM Microservice**
  FastAPI-based microservice with:
  - strict JSON contracts (Pydantic schemas),
  - retry logic for Gemini API calls,
  - prompt templates for common tasks (classification, extraction, routing).

- **Prompt Engineering / Guardrails**
  System instructions minimize hallucinations; responses are validated and logged together with the original requests.

- **n8n Integration**
  Three ready-to-use pipelines:
  - `classification-pipeline.json` — classifies incoming requests,
  - `data-extraction-pipeline.json` — extracts structured entities,
  - `routing-pipeline.json` — routes requests to different systems.
  Webhook-based integration with the LLM service is supported.

- **Dashboard**
  React application with:
  - workflow and pipeline statistics,
  - activity charts and distribution charts by task type,
  - real-time updates via API.

- **Workflow Manager**
  - create workflows from templates,
  - select Gemini models,
  - edit prompts and parameters (temperature, max tokens, etc.).

- **Pipeline Logs & Analytics**
  - logs all pipeline runs (success/error),
  - filter by status, task type, time period,
  - analytics on LLM service response times.

- **Settings / DevOps Options**
  - manage API keys and LLM service endpoints,
  - Docker environment settings,
  - configure n8n and database connections.

## Local Setup

Requirements:

- Docker and Docker Compose
- A Google Gemini API account and key

Steps:

```bash
git clone https://github.com/n0namedeveloper/ai-workflow-automation.git
cd ai-workflow-automation

cp .env.example .env
# Set GEMINI_API_KEY and other required variables in .env

docker-compose up -d
```

After startup:

- Main App: http://localhost:3000
- LLM Service (FastAPI docs): http://localhost:8000/docs
- n8n: http://localhost:5678

## Working with n8n Pipelines

1. Import the JSON files from `n8n-workflows/` into your n8n instance.
2. Update the webhook URLs to point to your LLM service address (default: `http://llm-service:8000`).
3. Activate the workflows and test a few requests (classification, extraction, routing).

## Tech Stack

- **Frontend:** React, TypeScript, tRPC, Hono
- **Backend API:** tRPC router + Hono
- **LLM Microservice:** FastAPI (Python 3.11), Pydantic, Gemini API integration
- **Automation:** n8n (JSON workflows)
- **Database:** MySQL
- **Infrastructure:** Docker, docker-compose

## Possible Future Improvements

- Add support for multiple LLM providers (OpenAI, Anthropic, local models).
- Add RBAC and permission separation by teams/projects.
- Export workflow performance reports (PDF/CSV).
- A set of ready-made templates for common business cases (support triage, invoice extraction, meeting notes → tasks).
