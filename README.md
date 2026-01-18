# Discord Copilot

A comprehensive Discord bot powered by Google's Gemini models and Supabase. This project features a RAG (Retrieval-Augmented Generation) system, long-term memory, and a modern dashboard for managing bot behavior and knowledge.

## 🏗️ System Architecture

1.  **Discord Interface**: Users interact with the bot via a Discord channel.
2.  **RAG Engine**:
    *   User queries are embedded using **Gemini `text-embedding-004`**.
    *   Relevant context is retrieved from **Supabase** (PostgreSQL with `pgvector`).
3.  **Memory System**: Recent interactions are stored and retrieved to maintain conversation context.
4.  **Generative AI**: The bot uses **Gemini 2.0 Flash** to generate responses based on retrieved context, memory, and system instructions.
5.  **Dashboard**: A Next.js web application for:
    *   Updating System Instructions.
    *   Uploading and processing definitions/documents (PDFs).
    *   Managing the Knowledge Base.

## 📂 Project Structure

```text
discord-copilot/
├── bot.py                # Main Discord bot entry point and logic
├── list_models.py        # Utility to list available Gemini models
├── schema.sql           # Database schema definition (tables & extensions)
├── match_documents.sql   # SQL RPC function for vector similarity search
├── requirements.txt      # Python dependencies
├── dashboard/            # Next.js Web Dashboard
│   ├── app/             # Application source code (App Router)
│   ├── public/          # Static assets
│   └── package.json     # Frontend dependencies
└── README.md             # Project documentation
```

### Key Files & Responsibilities

*   **`bot.py`**:
    *   Initializes Discord client and Supabase connection.
    *   Handles `on_message` events.
    *   Performs RAG: Embeds queries -> searches DB -> retrieves context.
    *   Manages Memory: Fetches recent history -> stores new interactions.
    *   Calls Gemini API to generate responses.
*   **`dashboard/`**:
    *   Frontend interface for administrative tasks.
    *   Allows uploading PDFs which are parsed, chunked, and stored in the vector DB.
    *   Provides a settings interface to update the bot's persona/instructions.
*   **`schema.sql`**:
    *   Sets up `pgvector` extension.
    *   Defines tables: `bot_config` (settings), `chat_memory` (history), `knowledge_base` (RAG docs).

## 🛠️ Tech Stack

### Backend (Bot)
*   **Language**: Python
*   **Discord Lib**: `discord.py`
*   **Database**: `supabase` (Python Client)
*   **AI/ML**: `google-generativeai` (Gemini)

### Frontend (Dashboard)
*   **Framework**: Next.js 16 (App Router)
*   **Library**: React 19
*   **Styling**: Tailwind CSS v4
*   **Icons**: Lucide React
*   **PDF Processing**: `pdf-parse`, `pdf2json`

### Database
*   **Platform**: Supabase
*   **Engine**: PostgreSQL
*   **Extensions**: `vector` (pgvector)

## 🚀 How to Run

### Prerequisites
*   Python 3.10+
*   Node.js 18+ (for Dashboard)
*   Supabase Project (URL & Key)
*   Discord Bot Token
*   Google Gemini API Key

### 1. Setup Database
Run the contents of `schema.sql` and `match_documents.sql` in your Supabase SQL Editor to set up the tables and functions.

### 2. Run the Discord Bot
1.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2.  Configure Environment:
    *   The `bot.py` currently has credentials hardcoded (RECOMMENDED: Move these to a `.env` file).
3.  Start the bot:
    ```bash
    python bot.py
    ```

### 3. Run the Dashboard
1.  Navigate to the dashboard directory:
    ```bash
    cd dashboard
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.
