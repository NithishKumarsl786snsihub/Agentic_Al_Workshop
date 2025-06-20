#!/usr/bin/env python3
"""
Test script to verify all imports work correctly
"""

print("🔄 Testing imports...")

try:
    # Test basic imports
    print("1. Testing basic imports...")
    from services.website_generator import WebsiteGenerator
    print("   ✅ WebsiteGenerator imported successfully")
    
    from services.html_editor import HTMLEditor  
    print("   ✅ HTMLEditor imported successfully")
    
    from services.session_manager import SessionManager
    print("   ✅ SessionManager imported successfully")
    
    from services.intelligent_response import IntelligentResponseService
    print("   ✅ IntelligentResponseService imported successfully")
    
    # Test LangGraph imports
    print("2. Testing LangGraph imports...")
    from services.langgraph_agents import LangGraphWebsiteEditor
    print("   ✅ LangGraphWebsiteEditor imported successfully")
    
    # Test initialization
    print("3. Testing service initialization...")
    website_gen = WebsiteGenerator()
    print("   ✅ WebsiteGenerator initialized")
    
    html_editor = HTMLEditor()
    print("   ✅ HTMLEditor initialized")
    
    session_mgr = SessionManager()
    print("   ✅ SessionManager initialized")
    
    intelligent_resp = IntelligentResponseService()
    print("   ✅ IntelligentResponseService initialized")
    
    langgraph_editor = LangGraphWebsiteEditor()
    print("   ✅ LangGraphWebsiteEditor initialized")
    
    print("\n🎉 All imports and initializations successful!")
    print("✅ The application should start correctly now.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("🔧 Check your dependencies and paths.")
    
except Exception as e:
    print(f"❌ Initialization error: {e}")
    print("🔧 Check your configuration and environment variables.") 