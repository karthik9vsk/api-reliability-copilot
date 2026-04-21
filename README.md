# API Reliability Copilot (Cloudflare Workers)

AI-powered debugging assistant for API incidents using Cloudflare Workers + Workers AI + Durable Objects.

## Features
- Structured incident analysis (root cause, evidence, remediation)
- Session-based memory using Durable Objects
- Real-time UI with React
- Runs fully on Cloudflare edge

## Tech Stack
- Cloudflare Workers
- Workers AI (Llama 3)
- Durable Objects
- React + Vite

## Run locally

### Backend
wrangler dev

### Frontend
cd web
npm install
npm run dev

## Example
POST /payments returns 502 after deployment...

→ Returns structured debugging analysis