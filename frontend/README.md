# Kernel

Kernel is a Next.js application that allows you to chat with an AI assistant about the contents of a GitHub repository.

This project was built with a focus on a clean, minimal UI, and an extensible architecture for future features like PDF analysis.

## Features

- **Index GitHub Repositories**: Provide a public GitHub URL to have an AI analyze its structure and content.
- **AI-Generated Summary**: Get a quick summary of the repository after indexing.
- **Conversational Chat**: Ask questions about the code, architecture, or any other aspect of the repository.
- **Source-Grounded Answers**: The AI assistant provides sources from the repository to back up its answers.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later)
- Package manager like `pnpm`, `npm`, or `yarn`.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/kernel.git
    cd kernel
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Environment Variables

This application uses a backend service for repository indexing and chat.

1.  Create a `.env` file in the root of the project.
2.  Add the URL of your backend service:
    ```
    NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
    ```

### Running the Development Server

Once dependencies are installed and environment variables are set, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Project Structure

The frontend code is organized as follows:

-   `src/app/page.tsx`: The main application page, handling layout and top-level state.
-   `src/components/`: Reusable React components.
    -   `RepoForm.tsx`: Handles repository URL input and indexing.
    -   `ChatWindow.tsx`: The main chat interface.
-   `src/lib/api.ts`: An abstraction layer for backend communication.
-   `src/types/index.ts`: Shared TypeScript types for the frontend.

## Future Extensibility

The application is designed to be easily extended. For example, to add PDF chatting functionality:
1.  Enable the "PDF" tab in `src/app/page.tsx`.
2.  Create a `PdfForm.tsx` component for file uploads.
3.  Update the `chatWithRepo` function in `src/lib/api.ts` (or create a new `chatWithPdf` function) to handle the new knowledge type.
4.  The `ChatWindow.tsx` component is already built to accept a `knowledgeType` and `targetId`, making it reusable for different data sources.
