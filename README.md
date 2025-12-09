# 🧠 Kernel — Chat intelligently with any GitHub repository

Paste a GitHub URL, and let an AI assistant index the codebase and answer questions with source-linked context. Kernel uses Mastra to orchestrate a RAG pipeline that ingests repositories, embeds code, and helps you understand implementation details, architecture, and design decisions in natural language.

## ✨ Features

- **🔍 Repository Indexing**: Automatically processes and indexes GitHub repositories
- **💬 Intelligent Chat**: Ask questions about code structure, functionality, and implementation details
- **📄 Source References**: Get direct links to relevant code sections in GitHub
- **🎯 Context-Aware**: Understands code relationships and provides accurate answers
- **⚡ Real-time**: Fast responses with efficient vector-based search
- **🌐 Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## 🏗️ Architecture

### Backend (`/backend`)
- **Framework**: Mastra with TypeScript
- **AI Integration**: OpenAI GPT for chat responses
- **Vector Storage**: In-memory vector store for code embeddings
- **GitHub Integration**: Fetches and processes repository content
- **API**: RESTful endpoints for repository management and chat

### Frontend (`/frontend`)
- **Framework**: Next.js 14 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS
- **Styling**: Modern, accessible design system
- **State Management**: React hooks for local state
- **Routing**: App Router with dynamic routes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- GitHub token (optional, for higher rate limits)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/swgtds/kernel
   cd kernel
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Create .env file
   echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:3001" > .env
   ```

### Environment Variables

#### Backend (`.env`)
```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional - for higher GitHub API rate limits
GITHUB_TOKEN=your_github_token_here

# Server configuration
PORT=3001
NODE_ENV=development
```

#### Frontend (`.env`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```
   Server will start on `http://localhost:3001`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will start on `http://localhost:9000`

3. **Visit the Application**
   Open `http://localhost:9000` in your browser

## 📖 Usage

1. **Index a Repository**
   - Enter any public GitHub repository URL
   - Wait for the indexing process to complete
   - Get an AI-generated summary of the repository

2. **Start Chatting**
   - Ask questions about the code structure
   - Inquire about specific functions or components
   - Get explanations of complex logic
   - Explore architectural decisions

3. **Explore Sources**
   - Click on source references to view code directly on GitHub
   - Navigate to specific line numbers mentioned in responses

### Example Queries

- "What does the main function do?"
- "How is authentication implemented?"
- "Explain the database schema"
- "What are the main API endpoints?"
- "Show me how user data is validated"

## 🔧 API Documentation

### Repository Management

#### Register Repository
```http
POST /api/repo/register
Content-Type: application/json

{
  "githubUrl": "https://github.com/owner/repo"
}
```

**Response:**
```json
{
  "repoId": "github-owner-repo",
  "summary": "AI-generated repository summary"
}
```

#### Chat with Repository
```http
POST /api/repo/chat
Content-Type: application/json

{
  "repoId": "github-owner-repo",
  "message": "What does the main function do?",
  "conversationId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "conversationId": "conv-123",
  "answer": "The main function...",
  "sources": [
    {
      "filePath": "src/main.ts",
      "startLine": 10,
      "endLine": 25
    }
  ]
}
```

### Health Check
```http
GET /health
```

## 🛠️ Development

### Project Structure

```
kernel/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── agents/         # AI agents for processing
│   │   ├── config/         # Configuration management
│   │   ├── knowledge/      # Knowledge backends (GitHub, PDF)
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── store/          # Vector storage implementation
│   │   └── types/          # TypeScript type definitions
│   ├── package.json
│   └── tsconfig.json
└── frontend/               # Next.js web application
    ├── src/
    │   ├── app/           # Next.js App Router
    │   ├── components/    # React components
    │   ├── hooks/         # Custom React hooks
    │   ├── lib/           # Utility functions
    │   └── types/         # TypeScript definitions
    ├── package.json
    └── next.config.ts
```

### Available Scripts

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking

#### Frontend
- `npm run dev` - Start development server (port 9002)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Code Style

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for consistent code style
- **Prettier**: Code formatting (recommended)

## 🔒 Security

- Environment variables for sensitive data
- Input validation with Zod schemas
- CORS protection
- Secure HTTP headers
- No sensitive data in client-side code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models
- GitHub API for repository access
- Next.js and React communities
- Radix UI for accessible components
- Tailwind CSS for styling system

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

---
