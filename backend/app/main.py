from fastapi import FastAPI, HTTPException, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
import httpx
import msal
import json
import shutil
from pathlib import Path
from datetime import datetime

app = FastAPI(title="Outreach Backend", version="0.1.0")

# Allow local dev frontend to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve production build with caching (if dist folder exists)
DIST_PATH = Path(__file__).parent.parent.parent / "dist"
if DIST_PATH.exists():
    @app.middleware("http")
    async def add_cache_headers(request, call_next):
        response = await call_next(request)
        # Cache static assets for 1 year
        if request.url.path.startswith("/assets/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        # Don't cache HTML files
        elif request.url.path.endswith(".html") or request.url.path == "/":
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return response
    
    app.mount("/assets", StaticFiles(directory=str(DIST_PATH / "assets")), name="assets")
    app.mount("/", StaticFiles(directory=str(DIST_PATH), html=True), name="static")

class SendMailBody(BaseModel):
    to: EmailStr
    subject: str
    body: str
    # Optional runtime config (not recommended for production, but avoids .env)
    azure_client_id: str | None = None
    azure_tenant_id: str | None = None
    azure_client_secret: str | None = None
    mail_from: EmailStr | None = None

# Persistent token cache
TOKEN_CACHE_FILE = Path(__file__).parent.parent / ".token_cache.json"

def load_token_cache() -> dict:
    """Load tokens from disk."""
    if TOKEN_CACHE_FILE.exists():
        try:
            with open(TOKEN_CACHE_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_token_cache(cache: dict):
    """Save tokens to disk."""
    try:
        # Filter out flow data (only save actual tokens)
        tokens_only = {k: v for k, v in cache.items() if not k.endswith(":flow")}
        with open(TOKEN_CACHE_FILE, "w") as f:
            json.dump(tokens_only, f)
    except Exception as e:
        print(f"Warning: Failed to save token cache: {e}")

# Load existing tokens on startup
_token_cache = load_token_cache()

def get_access_token(client_id: str, tenant_id: str) -> str:
    """Get cached access token with automatic refresh. Raises 401 if not authenticated."""
    cache_key = f"{client_id}:{tenant_id}"
    
    if cache_key not in _token_cache or cache_key.endswith(":flow"):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please authenticate via Settings first."
        )
    
    token_data = _token_cache[cache_key]
    
    # If it's just a string (old format), return it but it might be expired
    if isinstance(token_data, str):
        return token_data
    
    # Try to use cached access token first
    if "access_token" in token_data:
        # Check if we have a refresh token and should refresh
        if "refresh_token" in token_data:
            # Try to refresh the token proactively
            try:
                authority = f"https://login.microsoftonline.com/{tenant_id}"
                scopes = ["https://graph.microsoft.com/Mail.Send"]
                
                app_msal = msal.PublicClientApplication(
                    client_id=client_id,
                    authority=authority,
                )
                
                result = app_msal.acquire_token_by_refresh_token(
                    token_data["refresh_token"],
                    scopes=scopes
                )
                
                if "access_token" in result:
                    # Update cache with new tokens
                    _token_cache[cache_key] = result
                    save_token_cache(_token_cache)
                    return result["access_token"]
            except Exception as e:
                print(f"Token refresh failed: {e}")
                # Fall through to return existing token
        
        return token_data["access_token"]
    
    raise HTTPException(
        status_code=401,
        detail="Authentication expired. Please re-authenticate via Settings."
    )

class AuthInitRequest(BaseModel):
    azure_client_id: str
    azure_tenant_id: str

class AuthInitResponse(BaseModel):
    user_code: str
    verification_uri: str
    message: str
    expires_in: int

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/auth/logout")
async def auth_logout(payload: AuthInitRequest):
    """Clear authentication tokens."""
    cache_key = f"{payload.azure_client_id}:{payload.azure_tenant_id}"
    
    # Remove token and flow data
    if cache_key in _token_cache:
        del _token_cache[cache_key]
    if f"{cache_key}:flow" in _token_cache:
        del _token_cache[f"{cache_key}:flow"]
    
    save_token_cache(_token_cache)
    return {"status": "logged_out"}

@app.post("/upload/logo")
async def upload_logo(logo: UploadFile = File(...)):
    """Upload logo image and save to public/images folder."""
    # Get the frontend public/images directory
    images_dir = Path(__file__).parent.parent.parent / "public" / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename with timestamp
    ext = logo.filename.split('.')[-1] if '.' in logo.filename else 'png'
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"user-logo-{timestamp}.{ext}"
    file_path = images_dir / filename
    
    # Save file
    with open(file_path, "wb") as f:
        shutil.copyfileobj(logo.file, f)
    
    # Return path relative to public directory
    return {"path": f"/images/{filename}"}

@app.post("/auth/init", response_model=AuthInitResponse)
async def auth_init(payload: AuthInitRequest):
    """Initiate device code flow and return code for user to enter."""
    authority = f"https://login.microsoftonline.com/{payload.azure_tenant_id}"
    scopes = ["https://graph.microsoft.com/Mail.Send"]
    
    app_msal = msal.PublicClientApplication(
        client_id=payload.azure_client_id,
        authority=authority,
    )
    
    flow = app_msal.initiate_device_flow(scopes=scopes)
    if "user_code" not in flow:
        raise HTTPException(status_code=500, detail="Failed to create device flow")
    
    # Store flow for completion (in production, use Redis or database)
    cache_key = f"{payload.azure_client_id}:{payload.azure_tenant_id}"
    _token_cache[f"{cache_key}:flow"] = (app_msal, flow)
    
    return AuthInitResponse(
        user_code=flow["user_code"],
        verification_uri=flow["verification_uri"],
        message=flow["message"],
        expires_in=flow.get("expires_in", 900)
    )

@app.post("/auth/complete")
async def auth_complete(payload: AuthInitRequest):
    """Complete device code flow and cache token."""
    cache_key = f"{payload.azure_client_id}:{payload.azure_tenant_id}"
    flow_data = _token_cache.get(f"{cache_key}:flow")
    
    if not flow_data:
        raise HTTPException(status_code=400, detail="No pending authentication flow")
    
    app_msal, flow = flow_data
    
    result = app_msal.acquire_token_by_device_flow(flow)
    
    if "access_token" not in result:
        error_msg = result.get("error_description", "Authentication failed")
        raise HTTPException(status_code=401, detail=error_msg)
    
    # Store full token response (includes refresh_token for auto-refresh)
    _token_cache[cache_key] = result
    del _token_cache[f"{cache_key}:flow"]
    
    # Persist token to disk
    save_token_cache(_token_cache)
    
    return {"status": "authenticated"}

@app.get("/auth/status")
async def auth_status(client_id: str, tenant_id: str):
    """Check if user is authenticated. Fast check - just verifies token exists."""
    cache_key = f"{client_id}:{tenant_id}"
    
    if cache_key not in _token_cache or cache_key.endswith(":flow"):
        return {"authenticated": False}
    
    token_data = _token_cache[cache_key]
    
    # Check if we have token data
    if isinstance(token_data, str):
        # Old format - assume valid for now
        return {"authenticated": True}
    elif "access_token" in token_data:
        # New format - we have a token
        return {"authenticated": True}
    
    return {"authenticated": False}

@app.post("/send/mail")
async def send_mail(payload: SendMailBody):
    """Send email via Microsoft Graph API."""
    client_id = payload.azure_client_id or "4bb85405-0fc5-4dcc-b758-f2bb54057a57"
    tenant_id = payload.azure_tenant_id or "consumers"
    mail_from = str(payload.mail_from or "beaumeteens@gmail.com")
    
    try:
        # Get access token
        access_token = get_access_token(client_id, tenant_id)
        
        # Prepare email payload for Microsoft Graph
        graph_payload = {
            "message": {
                "subject": payload.subject,
                "body": {
                    "contentType": "Text",
                    "content": payload.body
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": payload.to
                        }
                    }
                ]
            },
            "saveToSentItems": "true"
        }
        
        # Send via Microsoft Graph API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://graph.microsoft.com/v1.0/me/sendMail",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=graph_payload,
                timeout=30.0
            )
            
            if response.status_code == 202:
                return {
                    "status": "sent",
                    "to": payload.to,
                    "subject": payload.subject,
                    "message": "Email sent successfully via Microsoft Graph"
                }
            else:
                error_detail = response.text
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Graph API error: {error_detail}"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
