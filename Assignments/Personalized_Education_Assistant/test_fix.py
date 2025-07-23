import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Get API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found in environment variables")
    exit(1)

print("🔑 API Key found!")

# Test direct Gemini API
try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    response = model.generate_content("Say 'Hello, Gemini is working!'")
    print("✅ Direct Gemini API test:", response.text)
except Exception as e:
    print("❌ Direct Gemini API test failed:", str(e))

# Test LangChain integration
try:
    gemini_llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        google_api_key=GEMINI_API_KEY,
        temperature=0.7
    )
    response = gemini_llm.invoke("Say 'Hello, LangChain integration is working!'")
    print("✅ LangChain integration test:", response.content)
except Exception as e:
    print("❌ LangChain integration test failed:", str(e))

print("\n🎉 All tests completed!") 