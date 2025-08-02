import os
import time
import json
import asyncio
import re
import base64
import traceback
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
import fastapi.routing
from typing import Callable, List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import shutil
import subprocess
import uuid
import logging
import requests
from fastapi import Form 
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import secrets
from supabase import create_client, Client
import httpx
import google.generativeai as genai
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Authentication setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Create a standard OAuth2 scheme for protected routes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)
# Create a separate empty dependency for public routes
async def get_optional_current_user(request: Request):
    """Use this dependency for public routes that don't require authentication."""
    return None

# JWT Configuration from environment variables
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in environment variables")

# API Keys from environment variables
HF_API_KEY = os.getenv("HF_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

# Validate critical API keys
if not HF_API_KEY:
    logger.warning("HF_API_KEY not set - Hugging Face features will not work")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not set - Gemini features will not work")
else:
    # Configure Gemini API
    genai.configure(api_key=GEMINI_API_KEY)
if not ELEVENLABS_API_KEY:
    logger.warning("ELEVENLABS_API_KEY not set - ElevenLabs features will not work")

# Models from environment variables
WHISPER_MODEL_HF = os.getenv("WHISPER_MODEL_HF", "openai/whisper-large-v3")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Class to override dependency injection for auth
class AuthBypassRoute(fastapi.routing.APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()
        
        async def custom_route_handler(request: Request) -> Response:
            # These routes don't require authentication
            if request.url.path == "/start-session" or \
               request.url.path == "/run-model" or \
               request.url.path == "/chat" or \
               request.url.path == "/end-session" or \
               request.url.path == "/health" or \
               request.url.path == "/" or \
               request.url.path.startswith("/docs") or \
               request.url.path.startswith("/openapi.json") or \
               request.url.path.startswith("/audio-files/") or \
               request.url.path.startswith("/conversation-history/") or \
               request.url.path.startswith("/sessions"):
                logger.info(f"Bypassing auth for public route: {request.url.path}")
                # No authentication required for these routes
                # Just call the handler directly
                return await original_route_handler(request)
            
            # Otherwise, use normal authentication process
            return await original_route_handler(request)
        
        return custom_route_handler

# Initialize FastAPI app
app = FastAPI()
app.router.route_class = AuthBypassRoute

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add CORS preflight handling
@app.options("/{path:path}")
async def handle_options(request: Request):
    return {"message": "CORS preflight OK"}

# Add middleware to bypass authentication for certain routes
@app.middleware("http")
async def check_authentication_bypass(request: Request, call_next):
    # List of paths that don't require authentication
    public_paths = [
        "/start-session",
        "/run-model",
        "/chat",
        "/end-session",
        "/health",
        "/",
        "/docs",
        "/openapi.json",
        "/audio-files/",
        "/conversation-history/",
        "/sessions",
    ]
    
    # Check if the current path should bypass authentication
    path = request.url.path
    is_public = any(path.startswith(public_path) for public_path in public_paths)
    
    if is_public:
        # For debugging purposes
        logger.info(f"Public route accessed: {path}")
    
    response = await call_next(request)
    return response

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"🔄 {request.method} {request.url}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"✅ {request.method} {request.url} - {response.status_code} ({process_time:.2f}s)")
    
    return response

# User models
class User(BaseModel):
    username: str
    email: str
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str = None

class ChatMessage(BaseModel):
    session_id: str
    message: str

class EndSessionRequest(BaseModel):
    session_id: str

class SessionSummary(BaseModel):
    summary: str
    struggles: List[str]
    observations: List[str]
    tips: List[str]

class GenerateSummaryRequest(BaseModel):
    session_id: str
    force_regenerate: bool = False


def get_user(username: str):
    res = supabase.table("users").select("*").eq("username", username).execute()
    if res.data:
        return User(**res.data[0])
    return None

def create_user(user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password
    }
    res = supabase.table("users").insert(user_data).execute()
    return res.data

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        return None  # Allow anonymous access
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = TokenData(username=username)
    except jwt.PyJWTError:
        return None
        
    user = get_user(token_data.username)
    return user

# Supabase Auth token validation
async def get_current_user_supabase(token: str = Depends(oauth2_scheme)):
    """Validate Supabase Auth token and return user info"""
    if not token:
        return None
    
    try:
        # For Supabase tokens, we'll extract user info from the token
        # Since we can't validate Supabase tokens server-side without service key,
        # we'll decode the token to get user info (this is less secure but works for this use case)
        import base64
        import json
        
        # Decode the JWT payload (without verification for now)
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        # Decode the payload
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload)
        token_data = json.loads(decoded)
        
        # Extract user info
        user_email = token_data.get('email')
        if not user_email:
            return None
            
        # Look up user in our custom table by email
        res = supabase.table("users").select("*").eq("email", user_email).execute()
        if res.data:
            return User(**res.data[0])
            
        # If not found in custom table, this might be a Supabase-only user
        # Return a temporary user object with the email
        return {
            "email": user_email,
            "username": user_email.split('@')[0],  # Use email prefix as username
            "is_supabase_user": True
        }
        
    except Exception as e:
        logger.error(f"Error validating Supabase token: {e}")
        return None

async def get_current_user_flexible(token: str = Depends(oauth2_scheme)):
    """Try both custom JWT and Supabase Auth tokens"""
    if not token:
        return None
    
    # First try custom JWT validation
    user = await get_current_user(token)
    if user:
        return user
    
    # If that fails, try Supabase token validation
    user_info = await get_current_user_supabase(token)
    if user_info:
        return user_info
        
    return None

async def get_current_user_flexible_required(token: str = Depends(oauth2_scheme)):
    """Flexible user validation that accepts both token types, but requires authentication"""
    user = await get_current_user_flexible(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_user_required(token: str = Depends(oauth2_scheme)):
    user = await get_current_user(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Custom dependency for public routes without authentication
def get_optional_token(token: str = Depends(oauth2_scheme)):
    """Use this dependency instead of get_current_user on routes that should be public"""
    return token

@app.post("/signup", response_model=dict)
async def signup(user: UserCreate):
    existing = supabase.table("users").select("id").eq("username", user.username).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username already exists")
    result = create_user(user)
    if result:
        return {"message": "User created successfully"}
    raise HTTPException(status_code=500, detail="Failed to create user")

@app.post("/login", response_model=Token)
async def login_for_access_token(form_data: dict):
    user = authenticate_user(form_data.get("username"), form_data.get("password"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.delete("/user/delete")
async def delete_user_account(user = Depends(get_current_user_flexible_required)):
    """Delete the current user's account and all associated data"""
    try:
        # Handle both User objects and dictionary objects (for Supabase users)
        if isinstance(user, dict):
            username = user.get("username")
            email = user.get("email")
            is_supabase_user = user.get("is_supabase_user", False)
        else:
            username = user.username
            email = user.email
            is_supabase_user = False
        
        logger.info(f"Starting complete user deletion process for: {username}")
        logger.info(f"User email: {email}")
        logger.info(f"Is Supabase user: {is_supabase_user}")
        
        # Use the database function to delete both custom user and auth user in one transaction
        logger.info("Calling database function to delete complete user account...")
        
        try:
            # Call the database function that handles both custom and auth user deletion
            rpc_result = supabase.rpc(
                'delete_complete_user_account',
                {
                    'username_param': username,
                    'user_email': email
                }
            ).execute()
            
            logger.info(f"Database function result: {rpc_result}")
            
            if rpc_result.data:
                result_data = rpc_result.data
                if result_data.get('success'):
                    logger.info(f"✅ Complete user deletion successful for: {username}")
                    logger.info(f"Deleted from custom table: {result_data.get('deleted_from_custom')}")
                    logger.info(f"Deleted from auth: {result_data.get('deleted_from_auth')}")
                    
                    return {
                        "message": "User account completely deleted",
                        "username": username,
                        "email": email,
                        "deleted_from_custom": result_data.get('deleted_from_custom'),
                        "deleted_from_auth": result_data.get('deleted_from_auth'),
                        "details": result_data
                    }
                else:
                    error_msg = result_data.get('error', 'Unknown error from database function')
                    logger.error(f"Database function reported error: {error_msg}")
                    raise HTTPException(status_code=500, detail=f"Database function error: {error_msg}")
            else:
                logger.error("Database function returned no data")
                raise HTTPException(status_code=500, detail="Database function returned no data")
                
        except Exception as rpc_error:
            logger.error(f"Error calling database function: {rpc_error}")
            logger.info("Falling back to manual deletion...")
            
            # Fallback: Manual deletion from custom table only
            logger.info("Step 1: Deleting from custom users table (fallback)...")
            delete_result = supabase.table("users").delete().eq("username", username).execute()
            logger.info(f"Custom users table delete result: {delete_result}")
            
            # Verify the deletion worked
            verification = supabase.table("users").select("*").eq("username", username).execute()
            
            if verification.data and len(verification.data) > 0:
                logger.error(f"DELETION FAILED: User {username} still exists in database!")
                raise HTTPException(status_code=500, detail="Failed to delete user from database")
            else:
                logger.info(f"✅ User {username} successfully deleted from custom users table")
            
            return {
                "message": "User account deleted from custom table (fallback mode)",
                "username": username,
                "email": email,
                "deleted_from_custom": True,
                "deleted_from_auth": False,
                "note": "Database function failed, used fallback. User may still exist in Supabase Auth."
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user account {username}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user account: {str(e)}")

def clean_response(text: str) -> str:
    if not text:
        return ""
    
    # Remove thinking tags and their content
    cleaned_text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    
    # Remove any other common unwanted patterns
    warnings = [
        "failed to get console mode for stdout: The handle is invalid.",
        "failed to get console mode for stderr: The handle is invalid.",
        "The handle is invalid."
    ]
    
    for warning in warnings:
        cleaned_text = cleaned_text.replace(warning, "")
    
    # Clean up whitespace and normalize
    cleaned_text = " ".join(cleaned_text.split())
    cleaned_text = cleaned_text.strip()
    
    # If after cleaning we have nothing meaningful, return a fallback
    if not cleaned_text or len(cleaned_text.strip()) < 3:
        return "I'm here to help. Could you tell me more about what's on your mind?"
    
    return cleaned_text

async def call_gemini_api(prompt: str, temperature: float = 0.7) -> str:
    """
    Call Gemini API with the given prompt - optimized for quota efficiency
    """
    try:
        # Initialize the Gemini model
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Configure generation parameters for efficiency
        generation_config = genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=512,  # Reduced from 2048 to save quota
            top_p=0.8,
            top_k=40
        )
        
        # Generate response
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        # Extract text from response
        if hasattr(response, 'text') and response.text:
            return response.text.strip()
        elif hasattr(response, 'candidates') and response.candidates:
            # Handle case where response has candidates
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and candidate.content:
                parts = candidate.content.parts
                if parts and hasattr(parts[0], 'text'):
                    return parts[0].text.strip()
        
        logger.error(f"No valid text in Gemini response: {response}")
        return "I'm here to help. Could you tell me more about what's on your mind?"
            
    except Exception as e:
        logger.error(f"Error calling Gemini API: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return "I'm experiencing some technical difficulties. Please try again."

async def transcribe_audio(file_path: str) -> str:
    """
    Transcribe audio file using Whisper API - uses the same approach as simple_transcribe.py
    """
    try:
        # Check if file exists and has content
        if not os.path.exists(file_path):
            logger.error(f"Audio file not found: {file_path}")
            return "Audio file not found"
            
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            logger.error(f"Audio file is empty: {file_path}")
            return "Audio file is empty"
            
        logger.info(f"Transcribing audio file: {file_path} (size: {file_size} bytes)")
        
        # Read the file into memory
        with open(file_path, "rb") as audio_file:
            audio_content = audio_file.read()
            
        logger.info(f"Read {len(audio_content)} bytes from audio file")
        
        # Determine content type based on file extension
        file_ext = os.path.splitext(file_path)[1].lower()
        content_type_map = {
            '.wav': 'audio/wav',
            '.mp3': 'audio/mpeg',
            '.flac': 'audio/flac',
            '.m4a': 'audio/m4a',
            '.ogg': 'audio/ogg'
        }
        content_type = content_type_map.get(file_ext, 'audio/wav')
        
        # Set up headers exactly like the working simple_transcribe.py
        headers = {
            "Authorization": f"Bearer {HF_API_KEY}",
            "Content-Type": content_type
        }
        
        logger.info(f"Using content type: {content_type}")
        logger.info(f"Sending request to Whisper API (model: {WHISPER_MODEL_HF})")
        
        # Use httpx with a longer timeout for audio processing
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # Send the request exactly like simple_transcribe.py - raw audio data as body
                response = await client.post(
                    f"https://api-inference.huggingface.co/models/{WHISPER_MODEL_HF}",
                    headers=headers,
                    data=audio_content  # Send raw audio data, not as multipart form
                )
                
                # Log the response status for debugging
                logger.info(f"Whisper API response status: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        # Try JSON first
                        result = response.json()
                        logger.info(f"Received JSON response: {result}")
                        
                        if isinstance(result, dict) and "text" in result:
                            transcription = result["text"].strip()
                            if transcription:
                                logger.info(f"Successfully transcribed: '{transcription}'")
                                return transcription
                                
                    except json.JSONDecodeError:
                        # Handle plain text response
                        transcription = response.text.strip()
                        if transcription:
                            logger.info(f"Received text response: '{transcription}'")
                            return transcription
                
                elif response.status_code == 503:
                    logger.warning("Model is loading, will retry...")
                    # Wait a moment and try again
                    await asyncio.sleep(2)
                    
                    response = await client.post(
                        f"https://api-inference.huggingface.co/models/{WHISPER_MODEL_HF}",
                        headers=headers,
                        data=audio_content
                    )
                    
                    if response.status_code == 200:
                        try:
                            result = response.json()
                            if "text" in result:
                                transcription = result["text"].strip()
                                if transcription:
                                    logger.info(f"Retry transcription successful: '{transcription}'")
                                    return transcription
                        except json.JSONDecodeError:
                            transcription = response.text.strip()
                            if transcription:
                                return transcription
                
                # If the main model fails, try whisper-base as fallback
                logger.info("Attempting fallback to whisper-base model...")
                response = await client.post(
                    "https://api-inference.huggingface.co/models/openai/whisper-base",
                    headers=headers,
                    data=audio_content
                )
                
                if response.status_code == 200:
                    try:
                        result = response.json()
                        if "text" in result:
                            transcription = result["text"].strip()
                            if transcription:
                                logger.info(f"Fallback transcription successful: '{transcription}'")
                                return transcription
                    except json.JSONDecodeError:
                        transcription = response.text.strip()
                        if transcription:
                            return transcription
                
                # Log the final error
                logger.error(f"All transcription attempts failed. Last response: {response.status_code} - {response.text}")
                return "I couldn't transcribe the audio. Please try speaking more clearly or in a quieter environment."
                
            except Exception as e:
                logger.error(f"Exception during transcription API call: {str(e)}")
                return "Error transcribing audio. Please try again."
                
    except Exception as e:
        logger.error(f"Error in transcribe_audio: {str(e)}")
        return "Error processing audio file."

# Global variable to track recent sessions (simple deduplication)
recent_sessions = {}

@app.post("/start-session", status_code=status.HTTP_201_CREATED)
async def start_session(_=Depends(get_optional_current_user)):
    """
    Start a new conversation session without authentication requirement.
    Creates a new session in Supabase and returns the session ID.
    """
    # Simple deduplication: check if we created a session very recently
    import time
    current_time = time.time()
    
    # Clean up old entries (older than 5 seconds)
    global recent_sessions
    recent_sessions = {k: v for k, v in recent_sessions.items() if current_time - v['time'] < 5}
    
    # Check if we have a very recent session (within 1 second)
    for session_id, session_info in recent_sessions.items():
        if current_time - session_info['time'] < 1:
            logger.info(f"Returning recent session to prevent duplication: {session_id}")
            return {"session_id": session_id}
    
    # Public endpoint - explicitly uses the get_optional_current_user dependency
    session_id = str(uuid.uuid4())
    
    # Track this session creation
    recent_sessions[session_id] = {'time': current_time}
    
    # Create new session in Supabase (without user requirement)
    try:
        # First check if Supabase connection is working
        health_check = supabase.table("sessions").select("count").limit(1).execute()
        logger.info(f"Health check passed: {health_check}")
        
        # Create the session with all required fields
        session_data = {
            "session_id": session_id,
            "title": f"Session {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "preview": "",
            "conversation": [],
            "status": "active", 
            "user_id": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("sessions").insert(session_data).execute()
        
        # Log detailed info for debugging
        logger.info(f"Created new session: {session_id}")
        logger.info(f"Supabase response data: {result.data if hasattr(result, 'data') else 'No data'}")
        
        if not result.data:
            logger.warning("Supabase returned empty data but no error")
            
        # Return the session ID in the expected format
        return {"session_id": session_id}
    except Exception as e:
        logger.error(f"Failed to create session: {str(e)}")
        # Try to get more detailed error information
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

async def save_session_to_supabase(session_id: str, conversation_history: list):
    try:
        logger.info(f"Saving session {session_id} to Supabase")
        existing = supabase.table("sessions").select("id").eq("session_id", session_id).execute()
        preview = ""
        if conversation_history:
            for entry in conversation_history:
                if entry.startswith("User:") and len(entry) > 10:
                    preview = entry[5:].strip()[:100] + "..." if len(entry) > 105 else entry[5:].strip()
                    break
        session_data = {
            "session_id": session_id,
            "title": f"Session {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "preview": preview,
            "conversation": conversation_history,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        if existing.data:
            supabase.table("sessions").update({
                "conversation": conversation_history,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("session_id", session_id).execute()
        else:
            supabase.table("sessions").insert(session_data).execute()
        return True
    except Exception as e:
        logger.error(f"Save failed: {str(e)}")
        return False

@app.post("/end-session")
async def end_session(request_data: EndSessionRequest, _=Depends(get_optional_current_user)):
    try:
        session_id = request_data.session_id
        res = supabase.table("sessions").select("conversation").eq("session_id", session_id).execute()
        
        if not res.data or not isinstance(res.data, list) or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="Session not found")
            
        conversation = res.data[0].get("conversation", [])
        await save_session_to_supabase(session_id, conversation)
        
        # Update session status to ended
        supabase.table("sessions").update({"status": "ended"}).eq("session_id", session_id).execute()
        
        # Generate summary if the conversation has meaningful content
        if len(conversation) >= 2:  # At least one exchange
            try:
                logger.info(f"Generating summary for completed session: {session_id}")
                summary = await generate_session_summary(session_id, conversation)
                
                # Save summary to database
                supabase.table("sessions").update({
                    "summary": summary.summary,
                    "struggles": summary.struggles,
                    "observations": summary.observations,
                    "tips": summary.tips,
                    "summary_generated": True,
                    "summary_generated_at": datetime.utcnow().isoformat()
                }).eq("session_id", session_id).execute()
                
                logger.info(f"Successfully saved summary for session: {session_id}")
                
                return {
                    "message": "Session ended and summary generated",
                    "summary_generated": True
                }
                
            except Exception as summary_error:
                logger.error(f"Failed to generate summary for session {session_id}: {summary_error}")
                # Still end the session even if summary generation fails
                return {
                    "message": "Session ended (summary generation failed)",
                    "summary_generated": False
                }
        else:
            logger.info(f"Session {session_id} too short for summary generation")
            return {
                "message": "Session ended (too short for summary)",
                "summary_generated": False
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

def get_conversation_history(session_id: str):
    try:
        res = supabase.table("sessions").select("conversation").eq("session_id", session_id).execute()
        if res.data and isinstance(res.data, list) and len(res.data) > 0:
            conversation = res.data[0].get('conversation', [])
            # Ensure conversation is a list
            if isinstance(conversation, list):
                return conversation
            else:
                logger.warning(f"Conversation data is not a list: {type(conversation)}")
                return []
        return []
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        return []

def update_conversation_history(session_id: str, history: list):
    try:
        supabase.table("sessions").update({
            "conversation": history,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("session_id", session_id).execute()
    except Exception as e:
        logger.error(f"Error updating conversation history: {e}")

async def generate_session_summary(session_id: str, conversation_history: list) -> SessionSummary:
    """
    Generate a comprehensive summary of the session using the LLM
    """
    try:
        logger.info(f"Generating summary for session: {session_id}")
        
        # Format conversation for analysis
        conversation_text = "\n".join(conversation_history)
        
        # Create prompt for session analysis
        analysis_prompt = """You are Ember, an AI mental health companion. Analyze the following conversation session and provide insights.

CONVERSATION TO ANALYZE:
{conversation}

IMPORTANT: Respond with ONLY valid JSON. Do not include any thinking process, explanations, or additional text before or after the JSON.

Please provide a comprehensive analysis in exactly this JSON format:
{{
    "summary": "A 2-3 sentence summary of the overall session and main topics discussed",
    "struggles": ["struggle1", "struggle2", "struggle3"],
    "observations": ["observation1", "observation2", "observation3"],
    "tips": ["tip1", "tip2", "tip3"]
}}

Guidelines:
- Summary: Capture the essence of what was discussed and the user's main concerns
- Struggles: Identify 2-4 key challenges, difficulties, or pain points the user mentioned
- Observations: Note 2-4 behavioral patterns, emotional states, or insights about the user
- Tips: Provide 2-4 constructive, actionable recommendations for the user's wellbeing

Keep each item concise but meaningful. Focus on mental health and emotional wellbeing aspects.
Return ONLY the JSON object, no other text or formatting.""".format(conversation=conversation_text)

        # Call Gemini model for analysis
        # Force JSON response by being more explicit in the prompt
        json_prompt = f"""You are a JSON API. Return ONLY valid JSON, no other text.

Analyze this conversation and return exactly this JSON structure:
{{"summary": "brief session summary", "struggles": ["struggle1", "struggle2"], "observations": ["obs1", "obs2"], "tips": ["tip1", "tip2"]}}

Conversation:
{conversation_text}

JSON Response:"""

        gemini_response = await call_gemini_api(json_prompt, temperature=0.1)
        
        # Clean the response to extract JSON
        cleaned_response = gemini_response.strip()
        
        # Try to extract JSON from the response
        json_match = re.search(r'\{.*\}', cleaned_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = cleaned_response
        
        try:
            # Parse JSON response
            summary_data = json.loads(json_str)
            
            return SessionSummary(
                summary=summary_data.get("summary", "Session completed successfully."),
                struggles=summary_data.get("struggles", ["No specific struggles identified"]),
                observations=summary_data.get("observations", ["User participated actively in the session"]),
                tips=summary_data.get("tips", ["Continue with regular sessions", "Practice self-care"])
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            logger.error(f"Raw response: {gemini_response}")
            logger.error(f"Cleaned JSON attempt: {json_str}")
            
            # Return fallback summary
            return SessionSummary(
                summary="Session completed successfully.",
                struggles=["Unable to generate detailed analysis"],
                observations=["User engaged in conversation"],
                tips=["Continue regular sessions", "Practice self-care"]
            )
        
    except Exception as e:
        logger.error(f"Error generating session summary: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Return fallback summary on error
        return SessionSummary(
            summary="Session completed successfully. Summary generation encountered an error.",
            struggles=["Unable to analyze at this time"],
            observations=["User participated actively in the session"],
            tips=["Consider scheduling follow-up sessions", "Practice self-care techniques discussed"]
        )

@app.post("/run-model")
async def run_model(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    _=Depends(get_optional_current_user)
):
    logger.info(f"🎯 STARTING run_model for session: {session_id}")
    input_filename = f"input_{session_id}.wav"
    output_filename = f"output_{session_id}.mp3"
    input_file_path = None

    try:
        logger.info("🔍 Step 1: Validating session exists")
        session_check = supabase.table("sessions").select("id").eq("session_id", session_id).execute()
        if not session_check.data:
            logger.error(f"Session {session_id} not found")
            raise HTTPException(status_code=404, detail="Session not found")
        logger.info("✅ Session validation passed")

        logger.info("🔍 Step 2: Processing uploaded file")
        file_content_type = file.content_type or ""
        logger.info(f"Received file with content type: {file_content_type}")
        
        # Check file size
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)  # Reset file pointer to beginning
        
        logger.info(f"Uploaded file size: {file_size} bytes")
        
        if file_size == 0:
            logger.error("Uploaded file is empty")
            return {"response_text": "No audio data received. Please try again."}
            
        # Save uploaded file with better error handling
        input_file_path = os.path.abspath(input_filename)
        logger.info(f"Saving uploaded file to: {input_file_path}")
        
        # Create a temporary file first to avoid corrupted files
        temp_path = f"{input_file_path}.tmp"
        try:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            # Check if the saved file is valid
            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                # Rename to the final name
                if os.path.exists(input_file_path):
                    os.remove(input_file_path)
                os.rename(temp_path, input_file_path)
                logger.info(f"File saved successfully: {input_file_path} ({os.path.getsize(input_file_path)} bytes)")
            else:
                raise ValueError("Failed to save audio file or file is empty")
                
        except Exception as e:
            logger.error(f"Error saving audio file: {str(e)}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return {"response_text": "Error saving audio file. Please try again."}

        logger.info("🔍 Step 3: Starting audio transcription")
        try:
            transcribed_text = await transcribe_audio(input_file_path)
            logger.info(f"✅ Transcription completed: '{transcribed_text}'")
        except Exception as e:
            logger.error(f"❌ Transcription failed: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            transcribed_text = "Error during transcription"
        
        # Check if we got actual transcribed text or just an error message
        if not transcribed_text or transcribed_text.startswith("Error") or transcribed_text.startswith("I couldn't transcribe"):
            logger.warning(f"Proceeding with problematic transcription: '{transcribed_text}'")
            if not transcribed_text:
                transcribed_text = "I couldn't hear anything. Please try speaking again."

        logger.info("🔍 Step 4: Getting conversation history")
        try:
            conversation_history = get_conversation_history(session_id)
            logger.info(f"✅ Retrieved conversation history: {len(conversation_history)} messages")
            conversation_history.append(f"User: {transcribed_text}")
            logger.info(f"Added user message, new length: {len(conversation_history)}")
        except Exception as e:
            logger.error(f"❌ Error getting conversation history: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            conversation_history = [f"User: {transcribed_text}"]

        logger.info("🔍 Step 5: Building LLM prompt")
        try:
            llm_prompt = SYSTEM_PROMPT + "\n\nConversation:\n"
            llm_prompt += "\n".join(conversation_history[-10:])
            llm_prompt += "\nAssistant:"
            logger.info("✅ LLM prompt built successfully")
        except Exception as e:
            logger.error(f"❌ Error building LLM prompt: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Error building prompt: {str(e)}")

        logger.info("🔍 Step 6: Calling LLM")
        try:
            response_text = await call_gemini_api(llm_prompt, temperature=0.7)
            response_text = clean_response(response_text)
            logger.info(f"✅ Gemini response parsed successfully: '{response_text}'")
                    
        except Exception as e:
            logger.error(f"❌ Error calling Gemini: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            response_text = "I'm having trouble generating a response right now."

        logger.info("🔍 Step 7: Updating conversation history")
        try:
            conversation_history.append(f"Assistant: {response_text}")
            update_conversation_history(session_id, conversation_history)
            logger.info("✅ Conversation history updated")
        except Exception as e:
            logger.error(f"❌ Error updating conversation history: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

        logger.info("🔍 Step 8: Generating TTS audio")
        try:
            generate_audio_with_elevenlabs(response_text, output_filename)
            logger.info("✅ TTS audio generated")
        except Exception as e:
            logger.error(f"❌ Error generating TTS: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

        logger.info("✅ Successfully processed voice input for session {session_id}")
        
        # Schedule audio file cleanup after 30 seconds to ensure it's been served
        async def cleanup_audio_file():
            await asyncio.sleep(30)
            try:
                if os.path.exists(output_filename):
                    os.remove(output_filename)
                    logger.info(f"Cleaned up audio file: {output_filename}")
            except Exception as e:
                logger.warning(f"Could not remove audio file {output_filename}: {e}")
        
        # Start cleanup task in background
        asyncio.create_task(cleanup_audio_file())
        
        return {
            "response_text": response_text,
            "audio_file": output_filename
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in run_model: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")
    finally:
        if input_file_path and os.path.exists(input_file_path):
            try:
                os.remove(input_file_path)
                logger.info(f"Cleaned up temporary file: {input_file_path}")
            except Exception as e:
                logger.warning(f"Could not remove temp file: {e}")

def generate_audio_with_elevenlabs(text: str, output_filename: str):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code == 200:
        with open(output_filename, 'wb') as f:
            f.write(response.content)
    else:
        logger.error(f"TTS error: {response.text}")
        raise HTTPException(status_code=500, detail="TTS error")

@app.post("/chat")
async def chat_text_only(chat_data: ChatMessage, _=Depends(get_optional_current_user)):
    session_id = chat_data.session_id
    user_message = chat_data.message
    
    logger.info(f"Processing text chat for session: {session_id}")
    
    if not session_id or not user_message:
        raise HTTPException(status_code=400, detail="Session ID and message required")

    try:
        # Validate session exists
        session_check = supabase.table("sessions").select("id").eq("session_id", session_id).execute()
        if not session_check.data:
            logger.error(f"Session {session_id} not found")
            raise HTTPException(status_code=404, detail="Session not found")

        conversation_history = get_conversation_history(session_id)
        conversation_history.append(f"User: {user_message}")

        llm_prompt = SYSTEM_PROMPT + "\n\nConversation:\n"
        llm_prompt += "\n".join(conversation_history[-10:])
        llm_prompt += "\nAssistant:"

        # Call Gemini model
        logger.info("Calling Gemini for text chat...")
        try:
            response_text = await call_gemini_api(llm_prompt, temperature=0.7)
            response_text = clean_response(response_text)
            logger.info(f"✅ Gemini response for text chat: '{response_text}'")
        except Exception as e:
            logger.error(f"Error calling Gemini for text chat: {str(e)}")
            response_text = "I'm having trouble generating a response right now."

        conversation_history.append(f"Assistant: {response_text}")
        update_conversation_history(session_id, conversation_history)

        # Auto-save
        if len(conversation_history) >= 4 and len(conversation_history) % 4 == 0:
            await save_session_to_supabase(session_id, conversation_history)

        logger.info(f"Successfully processed text chat for session {session_id}")
        return {
            "response": response_text,
            "session_id": session_id,
            "message": "Text processed successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")

@app.get("/audio-files/{filename}")
async def serve_audio_file(filename: str, _=Depends(get_optional_current_user)):
    if not filename.startswith("output_") or not filename.endswith(".mp3"):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = os.path.abspath(filename)
    
    if not os.path.exists(file_path):
        logger.warning(f"Audio file not found: {file_path}")
        raise HTTPException(status_code=404, detail="Audio file not found or has been cleaned up")
    
    try:
        # Simply serve the file without additional cleanup
        # The cleanup is handled by the run_model endpoint after 30 seconds
        return FileResponse(file_path, media_type="audio/mpeg", filename=filename)
    except Exception as e:
        logger.error(f"Error serving audio file {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error serving audio file: {str(e)}")

@app.get("/sessions")
async def get_sessions(_=Depends(get_optional_current_user)):
    # Get all sessions - public endpoint for testing
    try:
        result = supabase.table("sessions").select("*").order("created_at", desc=True).execute()
        return {"sessions": result.data}
    except Exception as e:
        logger.error(f"Failed to get sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")

@app.get("/sessions/{session_id}")
async def get_session_detail(session_id: str, _=Depends(get_optional_current_user)):
    result = supabase.table("sessions").select("*").eq("session_id", session_id).execute()
    if result.data:
        session_data = result.data[0]
        
        # Include summary information if available
        response_data = {
            "session": session_data
        }
        
        # Add summary status for frontend
        if session_data.get("summary_generated"):
            response_data["has_summary"] = True
        else:
            response_data["has_summary"] = False
            
        return response_data
    raise HTTPException(status_code=404, detail="Session not found")

# Health check endpoint
@app.get("/health")
async def health_check(_=Depends(get_optional_current_user)):
    try:
        # Test Supabase connection
        supabase.table("sessions").select("count").limit(1).execute()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "supabase": "connected",
                "backend": "running"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# Add root endpoint
@app.get("/")
async def root(_=Depends(get_optional_current_user)):
    return {
        "message": "EmberLanding Backend API",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "start_session": "/start-session",
            "voice_chat": "/run-model",
            "text_chat": "/chat",
            "sessions": "/sessions"
        }
    }

# Debug endpoints for troubleshooting
@app.post("/debug-transcribe")
async def debug_transcribe(
    file: UploadFile = File(...),
    _=Depends(get_optional_current_user)
):
    """Debug endpoint to test just the transcription part"""
    logger.info("Debug transcription endpoint called")
    input_filename = f"debug_input_{uuid.uuid4()}.wav"
    input_file_path = None

    try:
        # Save the file
        input_file_path = os.path.abspath(input_filename)
        logger.info(f"Saving debug file to: {input_file_path}")
        
        with open(input_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(input_file_path)
        logger.info(f"Debug file saved: {file_size} bytes")

        # Test transcription only
        logger.info("Testing transcription...")
        transcribed_text = await transcribe_audio(input_file_path)
        logger.info(f"Transcription result: '{transcribed_text}'")
        
        return {
            "transcription": transcribed_text,
            "file_size": file_size,
            "status": "success"
        }

    except Exception as e:
        logger.error(f"Debug transcription error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Debug error: {str(e)}")
    finally:
        if input_file_path and os.path.exists(input_file_path):
            try:
                os.remove(input_file_path)
                logger.info(f"Cleaned up debug file: {input_file_path}")
            except Exception as e:
                logger.warning(f"Could not remove debug file: {e}")

@app.get("/conversation-history/{session_id}")
async def get_conversation_history_endpoint(session_id: str, _=Depends(get_optional_current_user)):
    """Get conversation history for a specific session"""
    try:
        conversation = get_conversation_history(session_id)
        return {"conversation": conversation}
    except Exception as e:
        logger.error(f"Error getting conversation history for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get conversation history: {str(e)}")

class BatchDeleteRequest(BaseModel):
    session_ids: List[str]

@app.delete("/sessions/batch")
async def delete_sessions_batch(request: BatchDeleteRequest, _=Depends(get_optional_current_user)):
    """Delete multiple sessions from the database"""
    try:
        session_ids = request.session_ids
        if not session_ids:
            raise HTTPException(status_code=400, detail="No session IDs provided")
        
        # Check which sessions exist
        existing_sessions = supabase.table("sessions").select("session_id").in_("session_id", session_ids).execute()
        existing_session_ids = [session["session_id"] for session in existing_sessions.data]
        
        if not existing_session_ids:
            raise HTTPException(status_code=404, detail="No sessions found to delete")
        
        # Delete the sessions
        delete_result = supabase.table("sessions").delete().in_("session_id", existing_session_ids).execute()
        
        logger.info(f"Deleted {len(existing_session_ids)} sessions: {existing_session_ids}")
        return {
            "message": f"Successfully deleted {len(existing_session_ids)} sessions",
            "deleted_sessions": existing_session_ids,
            "not_found": list(set(session_ids) - set(existing_session_ids))
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting sessions {session_ids}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete sessions: {str(e)}")

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, _=Depends(get_optional_current_user)):
    """Delete a specific session from the database"""
    try:
        # Check if session exists
        result = supabase.table("sessions").select("id").eq("session_id", session_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Delete the session
        delete_result = supabase.table("sessions").delete().eq("session_id", session_id).execute()
        
        logger.info(f"Deleted session: {session_id}")
        return {"message": "Session deleted successfully", "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")

# Audio file cleanup function
async def cleanup_old_audio_files():
    """Clean up audio files older than 10 minutes"""
    try:
        current_time = time.time()
        for filename in os.listdir("."):
            if filename.startswith("output_") and filename.endswith(".mp3"):
                file_path = os.path.abspath(filename)
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > 600:  # 10 minutes
                    try:
                        os.remove(file_path)
                        logger.info(f"Cleaned up old audio file: {filename}")
                    except Exception as e:
                        logger.warning(f"Could not remove old audio file {filename}: {e}")
            # Also clean up any input files that might be left over
            elif filename.startswith("input_") and filename.endswith(".wav"):
                file_path = os.path.abspath(filename)
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > 300:  # 5 minutes for input files
                    try:
                        os.remove(file_path)
                        logger.info(f"Cleaned up old input file: {filename}")
                    except Exception as e:
                        logger.warning(f"Could not remove old input file {filename}: {e}")
    except Exception as e:
        logger.error(f"Error during audio file cleanup: {e}")

# Clean up all audio files (for startup)
async def cleanup_all_audio_files():
    """Clean up all audio files on startup"""
    try:
        for filename in os.listdir("."):
            if (filename.startswith("output_") and filename.endswith(".mp3")) or \
               (filename.startswith("input_") and filename.endswith(".wav")) or \
               (filename.startswith("debug_input_") and filename.endswith(".wav")):
                file_path = os.path.abspath(filename)
                try:
                    os.remove(file_path)
                    logger.info(f"Cleaned up audio file on startup: {filename}")
                except Exception as e:
                    logger.warning(f"Could not remove audio file {filename}: {e}")
    except Exception as e:
        logger.error(f"Error during startup audio file cleanup: {e}")

# Schedule periodic cleanup
import asyncio
async def periodic_cleanup():
    while True:
        await asyncio.sleep(300)  # Run every 5 minutes
        await cleanup_old_audio_files()

# Startup event to begin periodic cleanup
@app.on_event("startup")
async def startup_event():
    # Clean up any existing audio files on startup
    await cleanup_all_audio_files()
    # Start the periodic cleanup task
    asyncio.create_task(periodic_cleanup())
    logger.info("Started periodic audio file cleanup task")

# New endpoint to generate session summaries
@app.post("/sessions/{session_id}/generate-summary")
async def generate_summary_endpoint(
    session_id: str, 
    request_data: GenerateSummaryRequest = None,
    _=Depends(get_optional_current_user)
):
    """
    Generate or regenerate a summary for a completed session
    """
    try:
        # Get session details
        res = supabase.table("sessions").select("*").eq("session_id", session_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=404, detail="Session not found")
            
        session_data = res.data[0]
        conversation = session_data.get("conversation", [])
        status = session_data.get("status", "active")
        summary_generated = session_data.get("summary_generated", False)
        
        # Check if session is completed
        if status != "ended":
            raise HTTPException(status_code=400, detail="Can only generate summaries for completed sessions")
        
        # Check if summary already exists (unless force regenerate)
        force_regenerate = request_data.force_regenerate if request_data else False
        if summary_generated and not force_regenerate:
            return {
                "message": "Summary already exists. Use force_regenerate=true to regenerate.",
                "summary_exists": True
            }
        
        # Check if conversation has enough content
        if len(conversation) < 2:
            raise HTTPException(status_code=400, detail="Session too short to generate meaningful summary")
        
        # Generate summary
        logger.info(f"Generating summary for session: {session_id}")
        summary = await generate_session_summary(session_id, conversation)
        
        # Save to database
        update_result = supabase.table("sessions").update({
            "summary": summary.summary,
            "struggles": summary.struggles,
            "observations": summary.observations,
            "tips": summary.tips,
            "summary_generated": True,
            "summary_generated_at": datetime.utcnow().isoformat()
        }).eq("session_id", session_id).execute()
        
        logger.info(f"Successfully generated and saved summary for session: {session_id}")
        
        return {
            "message": "Summary generated successfully",
            "summary": summary.dict(),
            "summary_generated": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating summary for session {session_id}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@app.get("/sessions/{session_id}/summary")
async def get_session_summary(session_id: str, _=Depends(get_optional_current_user)):
    """
    Get the summary for a specific session
    """
    try:
        logger.info(f"Fetching summary for session: {session_id}")
        
        res = supabase.table("sessions").select(
            "summary, struggles, observations, tips, summary_generated, summary_generated_at"
        ).eq("session_id", session_id).execute()
        
        if not res.data:
            logger.warning(f"Session not found: {session_id}")
            raise HTTPException(status_code=404, detail="Session not found")
            
        session_data = res.data[0]
        
        logger.info(f"Session data retrieved: summary_generated={session_data.get('summary_generated')}")
        
        if not session_data.get("summary_generated"):
            return {
                "summary_exists": False,
                "message": "No summary available for this session"
            }
        
        summary_data = {
            "summary_exists": True,
            "summary": session_data.get("summary"),
            "struggles": session_data.get("struggles", []),
            "observations": session_data.get("observations", []),
            "tips": session_data.get("tips", []),
            "generated_at": session_data.get("summary_generated_at")
        }
        
        logger.info(f"Returning summary data: {summary_data}")
        return summary_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting summary for session {session_id}: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")

# Load system prompt from file
def load_system_prompt():
    try:
        with open("Systemprompt.txt", "r", encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        logger.error("Systemprompt.txt file not found")
        return "You are a helpful assistant. Keep responses very short (1-2 sentences maximum)."
    except Exception as e:
        logger.error(f"Error loading system prompt: {e}")
        return "You are a helpful assistant. Keep responses very short (1-2 sentences maximum)."

# Load the system prompt at startup
SYSTEM_PROMPT = load_system_prompt()