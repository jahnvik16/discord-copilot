import os
import discord
import asyncio
import time
from supabase import create_client, Client
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from google.api_core import exceptions
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, DISCORD_TOKEN, GEMINI_API_KEY]):
    raise ValueError("Missing environment variables. Please check .env file.")

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_EMBEDDING_MODEL = "models/text-embedding-004" 

# Initialize Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

# --- Helper Functions ---

def safe_generate_content(model, prompt, retries=3):
    """
    Standard try-except pattern for Gemini API calls to handle rate limits.
    """
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

def fetch_bot_config():
    try:
        response = supabase.table("bot_config").select("*").limit(1).execute()
        if response.data:
            return response.data[0]
        return None
    except Exception as e:
        print(f"Error fetching config: {e}")
        return None

def store_message(user_id, message, summary=""):
    try:
        data = {
            "user_id": str(user_id),
            "message": message,
            "summary": summary
        }
        supabase.table("chat_memory").insert(data).execute()
    except Exception as e:
        print(f"Error storing message: {e}")

def get_recent_memory(limit=5):
    try:
        response = supabase.table("chat_memory")\
            .select("message, summary")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        # Return in reverse order (oldest first)
        return response.data[::-1] if response.data else []
    except Exception as e:
        print(f"Error fetching memory: {e}")
        return []

def get_similar_content(query_text):
    try:
        result = genai.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            content=query_text,
            task_type="retrieval_query"
        )
        embedding = result['embedding']
        
        response = supabase.rpc(
            "match_documents",
            {
                "query_embedding": embedding,
                "match_threshold": 0.5,
                "match_count": 3
            }
        ).execute()
        
        return response.data if response.data else []
    except Exception as e:
        print(f"Error in RAG: {e}")
        return []

# --- Heartbeat Logic ---
def update_heartbeat(connected: bool):
    try:
        # Upsert status. Assuming single row with id=1 for this bot instance.
        data = {
            "id": 1,
            "connected": connected,
            "last_heartbeat": "now()" 
        }
        supabase.table("bot_status").upsert(data).execute()
    except Exception as e:
        print(f"Heartbeat error: {e}")

async def heartbeat_loop():
    await client.wait_until_ready()
    while not client.is_closed():
        update_heartbeat(True)
        await asyncio.sleep(10)

# --- Bot Logic ---
intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'We have logged in as {client.user}')
    client.loop.create_task(heartbeat_loop())

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    # 1. Fetch Config & Check Allow-list
    config = fetch_bot_config()
    if not config:
        print("Bot configuration missing.")
        return

    allowed_channel_id = config.get("discord_channel_id")
    
    # Strict Channel Check
    if allowed_channel_id and allowed_channel_id != "UNKNOWN_PLEASE_UPDATE":
        if str(message.channel.id) != str(allowed_channel_id):
            # Silently ignore messages from unauthorized channels
            return
    
    print(f"Processing message from {message.author}: {message.content}")

    try:
        async with message.channel.typing():
            # 2. RAG Retrieve
            context_docs = get_similar_content(message.content)
            context_text = "\n\n".join([doc['content'] for doc in context_docs])
            
            # 3. Memory Retrieve (Rolling Summary Context)
            history = get_recent_memory()
            history_text = "\n".join([f"Msg: {h['message']} (Summary: {h.get('summary', '')})" for h in history])

            # 4. Construct Prompt
            system_instr = config.get("system_instructions", "You are a helpful assistant.")
            
            prompt = f"""
            System Instructions: {system_instr}

            Context from Knowledge Base:
            {context_text}

            Recent Chat History:
            {history_text}

            User's New Message: {message.content}
            
            Provide a helpful response.
            """

            # 5. Generate Response (with retry)
            model = genai.GenerativeModel(GEMINI_MODEL)
            response = safe_generate_content(model, prompt)
            
            if response and response.text:
                bot_reply = response.text
                await message.channel.send(bot_reply)

                # 6. Generate Rolling Summary
                summary_prompt = f"""
                Summarize this interaction in one sentence for future context.
                User: {message.content}
                Bot: {bot_reply}
                """
                
                summary_response = safe_generate_content(model, summary_prompt)
                interaction_summary = summary_response.text.strip() if (summary_response and summary_response.text) else "Interaction stored."

                store_message(message.author.id, f"User: {message.content}\nBot: {bot_reply}", summary=interaction_summary)
            else:
                await message.channel.send("I'm having trouble connecting to my brain right now. Please try again.")

    except Exception as e:
        print(f"Error processing message: {e}")
        await message.channel.send("I encountered an error processing your request.")

if __name__ == "__main__":
    try:
        client.run(DISCORD_TOKEN)
    finally:
        update_heartbeat(False)
