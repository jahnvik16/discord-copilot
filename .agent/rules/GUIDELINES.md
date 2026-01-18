# Technical Guidelines & Architecture Standards

## 1. Tech Stack
*   **Frontend (The Architect)**: Next.js 16 (App Router)
*   **Backend (The Executive)**: Python (`discord.py`)
*   **Database**: Supabase (PostgreSQL with `pgvector` extension)
*   **AI**: Google Gemini (via `google-generativeai` SDK)

## 2. Core Requirements
The system is divided into two distinct phases of operation:

### Phase 1: The Architect (Next.js Dashboard)
*   **Role**: Configuration & Knowledge Management.
*   **Responsibilities**:
    *   Defines the bot's "Brain" (System Instructions).
    *   Ingests knowledge (PDF Uploads -> Parsing -> Chunking -> Vector Storage).
    *   Manages permissions (Allowed Discord Channels).
    *   Controls lifecycle (Session Resets/Memory Wiping).
    *   **Crucial**: Does NOT interact with Discord directly. It only talks to the Database.

### Phase 2: The Executive (Python Discord Bot)
*   **Role**: Runtime Execution.
*   **Responsibilities**:
    *   Listens to Discord events.
    *   Retrieves configuration and knowledge from the Database (Read-Only context).
    *   Generates responses using Gemini.
    *   Updates conversation memory in the Database.
    *   **Crucial**: Never changes its own system instructions or core knowledge. It only reads what the Architect defined.

## 3. Gap Analysis
Comparison of current implementation vs. Requirements:

| Feature | Status | Gap / Action Item |
| :--- | :--- | :--- |
| **RAG Engine** | ✅ Implemented | None. |
| **System Instructions** | ✅ Implemented | None. |
| **Discord Channel Control** | ⚠️ Partial | **Missing UI**: The bot checks for `discord_channel_id` but there is no Dashboard UI to set this. Need to add an "Allowed Channels" Management UI. |
| **Session Management** | ⚠️ Partial | **Missing UI**: Memory table exists, but there is no "Reset Session" button in the Dashboard to clear `chat_memory`. |
| **Security** | ❌ Critical | **Hardcoded Keys**: API Keys are hardcoded in `bot.py`. |

## 4. Coding Rules & Best Practices

### A. Architecture & Pattern
*   **Separation of Concerns**: Keep business logic separate from UI components.
    *   *Dashboard*: Server Actions for DB operations, Client Components for UI.
    *   *Bot*: Helper functions for DB/AI logic, Event handlers just for dispatch.
*   **Environment Variables**: **NEVER** hardcode credentials.
    *   Use `.env.local` for Next.js.
    *   Use `.env` for Python.
    *   All keys (`SUPABASE_URL`, `DISCORD_TOKEN`, `GEMINI_API_KEY`) must be loaded from environment.

### B. Memory Logic (Rolling Summary)
*   We use a **Rolling Summary** pattern for long-term memory to save context window.
*   **Mechanism**:
    1.  On every turn, generate a one-sentence summary of the interaction.
    2.  Store this summary alongside the raw message in `chat_memory`.
    3.  When retrieving context, fetch the last N summaries + last M raw messages.
    4.  If context gets too long, summarize older chunk into a single "Historical Context" block.

### C. Error Handling (Gemini API)
*   Implement robust error handling for API rate limits (`429`).
*   **Standard Pattern**:
    ```python
    import time
    from google.api_core import exceptions

    def safe_generate_content(model, prompt, retries=3):
        for attempt in range(retries):
            try:
                return model.generate_content(prompt)
            except exceptions.ResourceExhausted:
                wait_time = 2 * (attempt + 1)
                print(f"Rate limit hit. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            except Exception as e:
                print(f"API Error: {e}")
                break
        return None
    ```
