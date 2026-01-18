import os
from supabase import create_client, Client
import google.generativeai as genai

# Configuration
SUPABASE_URL = "https://uaojwglalkrqpldljrwj.supabase.co"
SUPABASE_KEY = "sb_publishable_aDU0w7vAwkGu0UEf1-S_3w_QmolqE2S"
GEMINI_API_KEY = "AIzaSyCFaCy6nUvinFyOXvNc3uIBg0gKn-WrfAQ"

def test_supabase():
    print("Testing Supabase connection...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase client initialized.")
        # Attempt a basic call - this might fail if tables don't exist, but confirming client creation is a start.
        try:
            supabase.table("bot_config").select("*").limit(1).execute()
            print("Successfully queried 'bot_config'.")
        except Exception as e:
            print(f"Query failed (expected if tables not created): {e}")
        return True
    except Exception as e:
        print(f"Supabase connection failed: {e}")
        return False

def test_gemini():
    print("\nTesting Gemini connection...")
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content("Hello, are you active?")
        print(f"Gemini response: {response.text}")
        return True
    except Exception as e:
        print(f"Gemini connection failed: {e}")
        return False

if __name__ == "__main__":
    print("--- Starting Connection Test ---\n")
    if test_supabase():
        test_gemini()
    print("\n--- Test Complete ---")
