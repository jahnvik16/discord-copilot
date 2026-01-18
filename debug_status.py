import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing credentials")
    exit(1)

supabase: Client = create_client(url, key)

try:
    response = supabase.table("bot_status").select("*").execute()
    print("Table exists. Data:", response.data)
except Exception as e:
    print(f"Error accessing table: {e}")
