# NeuralForge — Multi-Agent AI Coding System

A production-grade full-stack application where multiple AI agents collaborate
sequentially or in parallel to plan, implement, review, and debug code in real-time.

```
User Prompt → [Planner Agent] → [Coder Agent] → [Reviewer Agent] → [Debugger Agent]
                                                                          ↓
                         ← ← ← ← Socket.io streaming + RAG vector search ← ← ← ←
```

---

## 🆕 What's New (Latest Features)

- **Debugger Agent**: RAG-powered agent that autonomously analyzes code, finds bugs, and implements fixes using MCP file tools
- **Parallel Pipeline Execution**: Toggle between sequential and parallel execution modes for faster iteration
- **RAG (Retrieval Augmented Generation)**: Vector embeddings + FAISS vector store for context-aware agent responses
- **MCP File Tools**: Agents can now autonomously create, read, and write files in session workspace
- **Workspace Dashboard**: New dashboard page to browse generated files and session artifacts
- **Tool Call Tracking**: Real-time visibility of which tools agents are calling and their arguments
- **File Explorer UI**: Browse and inspect all workspace files generated during pipeline execution
- **Persistent Session Workspace**: All agent-generated code and artifacts stored per-session with retrieval APIs

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB (Mongoose) |
| Auth | JWT (bcryptjs) |
| AI — Planner/Coder/Debugger | Groq API (Llama 3, Mixtral) |
| AI — Reviewer | OpenRouter (Claude, GPT-4o, etc.) |
| AI — Multimodal | Google Gemini 1.5 Flash |
| RAG — Vector Store | FAISS + Node.js embeddings |
| File Management | MCP-compatible file tools + filesystem |
| Upload | Multer (memory storage) |
| Logging | Winston |

---

## Project Structure

```
multiagent/
├── server/
│   ├── agents/
│   │   ├── plannerAgent.js        # Step-by-step architecture planner
│   │   ├── coderAgent.js          # Code generation with MCP tools
│   │   ├── reviewerAgent.js       # Deep code review
│   │   ├── debuggerAgent.js       # RAG-powered debugging & fixes
│   │   └── multimodalAgent.js     # Vision/doc processing via Gemini
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── socket.js              # Socket.io + JWT auth middleware
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── generateController.js  # 202 async pipeline trigger
│   │   ├── uploadController.js    # Multimodal file handling
│   │   └── workspaceController.js # File listing & retrieval
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT protect
│   │   ├── errorMiddleware.js     # Centralized error handling
│   │   ├── rateLimitMiddleware.js # Tiered rate limits
│   │   └── uploadMiddleware.js    # Multer + MIME validation
│   ├── models/
│   │   ├── User.js                # Auth + model preferences
│   │   ├── Session.js             # Conversation history + pipeline mode
│   │   ├── VectorDocument.js      # RAG embeddings storage
│   │   └── WorkspaceFile.js       # Generated file metadata
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── generateRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── workspaceRoutes.js     # File browser API
│   ├── services/
│   │   ├── agentOrchestrator.js   # Sequential/parallel pipeline
│   │   ├── parallelOrchestrator.js # Parallel agent execution
│   │   ├── groqService.js         # Groq streaming + tool calls
│   │   ├── openrouterService.js   # OpenRouter SSE streaming
│   │   ├── geminiService.js       # Gemini multimodal
│   │   ├── mcpFileService.js      # MCP file tools (create/read/write)
│   │   ├── vectorStore.js         # FAISS vector operations
│   │   ├── embeddingService.js    # Text → embeddings
│   │   └── ragService.js          # RAG indexing & retrieval
│   ├── utils/
│   │   ├── logger.js              # Winston logger
│   │   ├── retryHelper.js         # Exponential backoff + jitter
│   │   └── sessionManager.js      # Session CRUD + context window
│   ├── workspace/                 # Per-session workspace root
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── client/
    └── src/
        ├── components/
        │   ├── AgentCard.jsx       # Streaming agent output card
        │   ├── MarkdownRenderer.jsx # Code highlighting
        │   ├── ModelSelector.jsx   # Per-agent model dropdown (now with Debugger)
        │   ├── PromptInput.jsx     # Textarea + file attach
        │   ├── ProtectedRoute.jsx
        │   ├── SessionSidebar.jsx  # Session list + history loader
        │   ├── TimelineFeed.jsx    # Sequential feed
        │   ├── TopBar.jsx          # Pipeline status + mode selector + dashboard link
        │   ├── FileExplorer.jsx    # Workspace file browser
        │   ├── ToolCallBadge.jsx   # Tool call visualization
        │   └── RagContextBadge.jsx # RAG retrieval info badge
        ├── hooks/
        │   ├── useSocket.js        # Socket.io + tool:call & rag:context events
        │   └── useAutoScroll.js    # Smart scroll management
        ├── pages/
        │   ├── AuthPage.jsx        # Register/login
        │   ├── ChatPage.jsx        # Main workspace with file explorer
        │   ├── DashboardPage.jsx   # Session artifacts & browse files
        │   └── LandingPage.jsx
        ├── services/
        │   └── api.js              # Axios + workspace API endpoints
        ├── store/
        │   ├── authStore.js        # Zustand — JWT persistence
        │   ├── pipelineStore.js    # Zustand — agent state + pipeline mode
        │   └── workspaceStore.js   # Zustand — tool calls & RAG context
        └── utils/
            └── agentConfig.js      # Agent colors, models, constants (includes Debugger)
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
  └─ setImmediate(() => runAgentPipeline(mode))
       ├─ Sequential Mode (default):
       │   ├─ PlannerAgent (Groq)    → streams via socket "agent:chunk"
       │   ├─ CoderAgent (Groq + MCP tools) → streams + "tool:call" events
       │   ├─ ReviewerAgent (OpenRouter) → streams
       │   └─ DebuggerAgent (Groq + RAG) → streams + "tool:call" + "rag:context"
       │
       └─ Parallel Mode:
           ├─ [PlannerAgent + CoderAgent + ReviewerAgent] → run in parallel
           └─ DebuggerAgent → runs sequentially after all (uses RAG from others)
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
| `tool:call` | server → client | `{ agent, tool, args }` |
| `rag:context` | server → client | `{ agent, queries, count, chunks }` |
| `pipeline:complete` | server → client | `{ sessionId }` |
| `pipeline:error` | server → client | `{ error, partialResults }` |

### Context Window

Each agent receives the last 10 messages from the session as conversation
history. This value is configurable via `CONTEXT_WINDOW_SIZE` in `.env`.

### Pipeline Modes

**Sequential (default)**: Agents run one after the other. Each agent's output informs the next.

**Parallel**: Planner, Coder, and Reviewer run concurrently. Debugger runs sequentially
after all others complete, with access to their outputs via RAG.

Toggle via UI dropdown or `pipelineMode` param in POST to `/api/generate`.

### Workspace File Management

Agents can call MCP tools to create and modify files:

```js
// Inside Debugger or Coder Agent
executeTool('create_file', {
  filePath: 'src/utils/helpers.js',
  content: '...'
});

executeTool('read_file', { filePath: 'src/config.js' });
```

Files are stored in `server/workspace/<userId>/<sessionId>/`.
Clients can browse via `/api/workspace/<sessionId>/files` and `/api/workspace/<sessionId>/file?path=...`.

### RAG (Retrieval Augmented Generation)

**Debugger Agent** indexes all prior agent outputs (planner, coder, reviewer) as vectors.
When processing code, it retrieves the most relevant context automatically:

1. Embed user queries from previous messages
2. Query FAISS vector store for similar chunks
3. Pass relevant chunks to LLM for context-aware fixes
4. Emit `rag:context` event with retrieval metadata

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

**Partial session save**: If the pipeline fails mid-run (e.g., Debugger
fails after Planner, Coder, and Reviewer succeed), whatever was collected up to that
point is persisted to MongoDB, so users can see partial results.

**MCP Tools in Groq**: Groq's native `tools` parameter allows agents to call
create_file, read_file, write_file, and list_files. The Debugger uses this
extensively to iterate on code based on vector-retrieved context.

**Workspace Filesystem**: Each `<userId>/<sessionId>/` directory holds artifacts.
Agents autonomously manage file creation. Clients retrieve via REST API.
No disk size limits enforced yet — production should add quotas.

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
3. **File storage**: Add size + count limits per session; consider cloud storage (S3/GCS)
4. **MongoDB**: Add replica set for high availability
5. **Vector store**: Replace in-memory FAISS with cloud vector DB (e.g., Pinecone, Weaviate)
6. **Rate limiting**: Use Redis-backed store for rate limits across multiple instances
7. **Secrets**: Use a secrets manager (Vault, AWS Secrets Manager)
8. **Monitoring**: Add OpenTelemetry tracing across the agent chain and file operations
9. **Workspace quotas**: Enforce per-user session storage limits and cleanup policies
10. **Tool execution timeouts**: Add timeout guards around executeTool calls in agents
