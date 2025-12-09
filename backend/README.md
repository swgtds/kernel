# RepoChat Backend

A TypeScript backend system that enables AI-powered chat with GitHub repositories using RAG (Retrieval Augmented Generation) and the Mastra framework.

## Features

- 📁 **Repository Ingestion**: Automatically clones and indexes GitHub repositories
- 🔍 **Semantic Search**: Uses OpenAI embeddings for intelligent code search
- 💬 **Contextual Chat**: Chat with repositories using conversation history
- 🔧 **Extensible Architecture**: Designed for easy addition of new knowledge sources (PDFs, docs, etc.)
- ⚡ **Type-Safe**: Full TypeScript implementation with proper error handling

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Web Framework**: Express
- **AI Framework**: Mastra
- **LLM Provider**: OpenAI (GPT-3.5-turbo)
- **Embeddings**: OpenAI text-embedding-ada-002
- **Vector Store**: In-memory (extensible to external stores)

## Prerequisites

- Node.js (v18 or higher)
- OpenAI API key
- GitHub personal access token (optional, for higher rate limits)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chat-repo-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GITHUB_TOKEN=your_github_token_here  # Optional
   PORT=3001
   NODE_ENV=development
   ```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:3001/health
```

## API Endpoints

### 1. Register GitHub Repository

**POST** `/api/repo/register`

Ingests a GitHub repository for chat.

**Request Body:**
```json
{
  "githubUrl": "https://github.com/owner/repo"
}
```

**Response:**
```json
{
  "repoId": "github:owner/repo",
  "summary": "AI-generated repository summary"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/repo/register \
  -H "Content-Type: application/json" \
  -d '{"githubUrl": "https://github.com/facebook/react"}'
```

### 2. Chat with Repository

**POST** `/api/repo/chat`

Start or continue a conversation with a registered repository.

**Request Body:**
```json
{
  "repoId": "github:owner/repo",
  "message": "How does the authentication work?",
  "conversationId": "optional_conversation_id"
}
```

**Response:**
```json
{
  "conversationId": "conv_1234567890_abc123",
  "answer": "Based on the repository code...",
  "sources": [
    {
      "filePath": "src/auth/index.ts",
      "startLine": 15,
      "endLine": 45
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/repo/chat \
  -H "Content-Type: application/json" \
  -d '{
    "repoId": "github:facebook/react",
    "message": "How does React handle state updates?"
  }'
```

### 3. Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

## Architecture

### Knowledge Abstraction Layer

The system is built around a `KnowledgeBackend` interface that allows for easy extension:

```typescript
interface KnowledgeBackend {
  ingest(input: unknown): Promise<string>;
  retrieve(id: string, query: string): Promise<RetrievedChunk[]>;
}
```

### Current Implementations

- **GithubKnowledgeBackend**: Fully implemented for GitHub repositories
- **PdfKnowledgeBackend**: Stubbed for future PDF support

### File Processing

The system processes these file types:
- Code: `.ts`, `.js`, `.tsx`, `.jsx`, `.py`, `.go`, `.java`, `.c`, `.cpp`, `.h`
- Documentation: `.md`, `.txt`
- Configuration: `.json`, `.yml`, `.yaml`, `.toml`
- Web: `.html`, `.css`, `.scss`
- Scripts: `.sh`, `.bash`
- Other: `.sql`, `.graphql`, `.env`, `Dockerfile`, `Makefile`

### Ignored Patterns

- `node_modules/`
- `dist/`, `build/`
- `.git/`
- Binary and image files
- IDE configuration directories

## Future Enhancements

### Planned Features

1. **PDF Knowledge Backend**
   - Endpoint: `POST /api/pdf/upload`
   - Endpoint: `POST /api/pdf/chat`
   - Text extraction and intelligent chunking
   - Page-based metadata preservation

2. **Enhanced Vector Store**
   - Persistent storage (Redis, Pinecone, etc.)
   - Better similarity search algorithms
   - Metadata filtering capabilities

3. **Advanced Features**
   - Multi-repository conversations
   - Code execution capabilities
   - Integration with more LLM providers
   - Webhook support for repository updates

### Extension Points

The modular architecture makes it easy to add:
- New knowledge backends (databases, APIs, file types)
- Different vector stores
- Alternative LLM providers
- Custom preprocessing pipelines

## Error Handling

The API includes comprehensive error handling:

- **400**: Validation errors (invalid input)
- **404**: Resource not found (conversation, repository)
- **500**: Server errors (OpenAI API, GitHub API, processing errors)

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include input validation
4. Update types when adding new features
5. Test with various repository sizes and types

## License

MIT License - see LICENSE file for details