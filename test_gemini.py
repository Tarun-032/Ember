#!/usr/bin/env python3
"""
Test script to verify Gemini API integration
"""

import os
import sys
import logging
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Load environment variables
load_dotenv()

try:
    import google.generativeai as genai
    print("✅ Successfully imported google.generativeai")
    
    # Check if API key is configured
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        if api_key == "your_gemini_api_key_here":
            print("⚠️  Please replace 'your_gemini_api_key_here' with your actual Gemini API key in .env file")
        else:
            print("✅ Gemini API key found in environment")
            
            # Try to configure the API
            try:
                genai.configure(api_key=api_key)
                print("✅ Gemini API configured successfully")
                
                # Try to list available models
                try:
                    models = list(genai.list_models())
                    print(f"✅ Found {len(models)} available Gemini models")
                    for model in models[:3]:  # Show first 3 models
                        print(f"   - {model.name}")
                except Exception as e:
                    print(f"⚠️  Could not list models (check API key): {e}")
                    
            except Exception as e:
                print(f"❌ Failed to configure Gemini API: {e}")
    else:
        print("⚠️  GEMINI_API_KEY not found in environment")
        
except ImportError as e:
    print(f"❌ Failed to import google.generativeai: {e}")
    print("Please install it with: pip install google-generativeai==0.8.3")

print("\n📝 Next steps:")
print("1. Get your Gemini API key from: https://aistudio.google.com/app/apikey")
print("2. Replace 'your_gemini_api_key_here' in the .env file with your actual API key")
print("3. Run your backend server: cd backend && python app.py")
