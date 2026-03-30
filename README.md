# NeuralForge — Multi-Agent AI Coding System

A production-grade full-stack application where multiple AI agents collaborate
sequentially to plan, implement, and review code in real-time.

```
User Prompt → [Planner Agent] → [Coder Agent] → [Reviewer Agent]
                                                        ↓
                              ← ← ← Socket.io streaming ← ← ←
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB (Mongoose) |
| Auth | JWT (bcryptjs) |
| AI — Planner/Coder | Groq API (Llama 3, Mixtral) |
| AI — Reviewer | OpenRouter (Claude, GPT-4o, etc.) |
| AI — Multimodal | Google Gemini 1.5 Flash |
| Upload | Multer (memory storage) |
| Logging | Winston |

---

## Project Structure

```
multiagent/
├── server/
│   ├── agents/
│   │   ├── plannerAgent.js        # Step-by-step architecture planner
│   │   ├── coderAgent.js          # Code generation
│   │   ├── reviewerAgent.js       # Deep code review
│   │   └── multimodalAgent.js     # Vision/doc processing via Gemini
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── socket.js              # Socket.io + JWT auth middleware
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── generateController.js  # 202 async pipeline trigger
│   │   └── uploadController.js    # Multimodal file handling
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT protect
│   │   ├── errorMiddleware.js     # Centralized error handling
│   │   ├── rateLimitMiddleware.js # Tiered rate limits
│   │   └── uploadMiddleware.js    # Multer + MIME validation
│   ├── models/
│   │   ├── User.js                # Auth + model preferences
│   │   └── Session.js             # Conversation history + context window
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── generateRoutes.js
│   │   └── uploadRoutes.js
│   ├── services/
│   │   ├── agentOrchestrator.js   # Sequential pipeline coordinator
│   │   ├── groqService.js         # Groq streaming completions
│   │   ├── openrouterService.js   # OpenRouter SSE streaming
│   │   └── geminiService.js       # Gemini multimodal
│   ├── utils/
│   │   ├── logger.js              # Winston logger
│   │   ├── retryHelper.js         # Exponential backoff + jitter
│   │   └── sessionManager.js      # Session CRUD + context window
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── client/
    └── src/
        ├── components/
        │   ├── AgentCard.jsx       # Streaming agent output card
        │   ├── MarkdownRenderer.jsx # Code highlighting
        │   ├── ModelSelector.jsx   # Per-agent model dropdown
        │   ├── PromptInput.jsx     # Textarea + file attach
        │   ├── ProtectedRoute.jsx
        │   ├── SessionSidebar.jsx  # Session list + history loader
        │   ├── TimelineFeed.jsx    # Sequential feed
        │   └── TopBar.jsx          # Pipeline status + connection
        ├── hooks/
        │   ├── useSocket.js        # Socket.io lifecycle + event wiring
        │   └── useAutoScroll.js    # Smart scroll management
        ├── pages/
        │   ├── AuthPage.jsx        # Register/login
        │   └── ChatPage.jsx        # Main workspace
        ├── services/
        │   └── api.js              # Axios + interceptors
        ├── store/
        │   ├── authStore.js        # Zustand — JWT persistence
        │   └── pipelineStore.js    # Zustand — agent state machine
        └── utils/
            └── agentConfig.js      # Agent colors, models, constants
```

---

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongod`)
- API keys for Groq, OpenRouter, and Google Gemini

---

## Setup & Installation

### 1. Clone and install dependencies

```bash
# Server
cd multiagent/server
npm install

# Client
cd ../client
npm install
```

### 2. Configure environment variables

```bash
cd multiagent/server
cp .env.example .env
```

Edit `.env` with your actual values:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/multiagent_ai

JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIza...

CONTEXT_WINDOW_SIZE=10
LOG_LEVEL=info
```

#### Getting API keys:
- **Groq**: https://console.groq.com (free tier available)
- **OpenRouter**: https://openrouter.ai (pay-as-you-go, cheap with Haiku)
- **Gemini**: https://aistudio.google.com/app/apikey (free tier available)

### 3. Start MongoDB

```bash
# Ubuntu
sudo systemctl start mongod

# macOS (Homebrew)
brew services start mongodb-community
```

### 4. Start the servers

```bash
# Terminal 1 — Backend
cd multiagent/server
npm run dev

# Terminal 2 — Frontend
cd multiagent/client
npm run dev
```

Open: http://localhost:5173

---

## How It Works

### Pipeline Flow

```
POST /api/generate
  └─ Returns 202 immediately (non-blocking)
  └─ setImmediate(() => runAgentPipeline())
       ├─ PlannerAgent (Groq)    → streams via socket "agent:chunk"
       ├─ CoderAgent   (Groq)    → streams via socket "agent:chunk"
       └─ ReviewerAgent (OpenRouter) → streams via socket "agent:chunk"
                                      → saves full session to MongoDB
                                      → emits "pipeline:complete"
```

### Socket.io Event Taxonomy

| Event | Direction | Payload |
|---|---|---|
| `agent:start` | server → client | `{ agent, model }` |
| `agent:chunk` | server → client | `{ agent, chunk }` |
| `agent:complete` | server → client | `{ agent, content }` |
| `agent:error` | server → client | `{ agent, error }` |
| `agent:retry` | server → client | `{ agent, attempt, waitMs }` |
| `pipeline:complete` | server → client | `{ sessionId }` |
| `pipeline:error` | server → client | `{ error, partialResults }` |

### Context Window

Each agent receives the last 10 messages from the session as conversation
history. This value is configurable via `CONTEXT_WINDOW_SIZE` in `.env`.

### Multimodal Upload Flow

```
POST /api/upload (multipart/form-data)
  └─ Multer validates MIME + extension
  └─ Returns 202 immediately
  └─ setImmediate(() => runMultimodalAgent())
       └─ Gemini 1.5 Flash processes file inline (no disk write)
       └─ Streams output via socket
       └─ Saves to session
```

---

## Key Architecture Decisions

**202 Accepted pattern**: Pipeline and upload both return HTTP 202 immediately.
All progress is communicated via Socket.io. This prevents HTTP timeouts for
long-running LLM chains and decouples transport from computation.

**Memory storage for uploads**: Multer stores files in RAM, not disk. The
buffer is passed directly to Gemini's `inlineData`. No cleanup debt, no disk
I/O bottleneck.

**Socket.io auth**: JWT is validated in the Socket.io handshake middleware
before the connection is accepted. Users join a private `user:{id}` room —
all events are scoped there, preventing cross-user leakage.

**Retry with jitter**: All agent calls use exponential backoff with ±30%
random jitter to prevent thundering herd when multiple agents retry
simultaneously under API rate limits.

**Partial session save**: If the pipeline fails mid-run (e.g., Reviewer
fails after Planner and Coder succeed), whatever was collected up to that
point is persisted to MongoDB, so users can see partial results.

---

## Supported File Types (Multimodal Agent)

| Category | Extensions |
|---|---|
| Images | `.jpg`, `.png`, `.webp` |
| Documents | `.pdf` |
| Code | `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.go`, `.rs`, `.rb`, `.php`, `.sh`, `.sql` |
| Text | `.txt`, `.md`, `.yaml`, `.yml`, `.json`, `.xml`, `.csv` |

Max file size: **10 MB**

---

## Rate Limits

| Endpoint | Limit |
|---|---|
| All routes | 100 req / 15 min |
| Auth (`/login`, `/register`) | 10 req / 15 min |
| `/api/generate` | 10 req / 1 min |
| `/api/upload` | 20 req / 1 min |

---

## Production Considerations

For moving beyond localhost, address these before deploying:

1. **Auth tokens**: Switch from localStorage to httpOnly cookies + CSRF tokens
2. **Pipeline jobs**: Replace `setImmediate` with BullMQ + Redis for job queuing,
   retries, and visibility across multiple server instances
3. **File storage**: Add size limits + cloud storage (S3/GCS) for large files
4. **MongoDB**: Add replica set for high availability
5. **Rate limiting**: Use Redis-backed store for rate limits across multiple instances
6. **Secrets**: Use a secrets manager (Vault, AWS Secrets Manager)
7. **Monitoring**: Add OpenTelemetry tracing across the agent chain
