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
import re
import base64

app = FastAPI(title="Outreach Backend", version="0.1.0")
# Simple .env loader
ENV_PATH = Path(__file__).parent.parent / ".env"
ENV_VARS: dict[str, str] = {}
if ENV_PATH.exists():
    try:
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                ENV_VARS[k] = v
    except Exception as e:
        print(f"Warning: Failed to read .env: {e}")

ENV_CLIENT_ID = ENV_VARS.get("AZURE_CLIENT_ID", "4bb85405-0fc5-4dcc-b758-f2bb54057a57")
ENV_TENANT_ID = ENV_VARS.get("AZURE_TENANT_ID", "consumers")
ENV_MAIL_FROM = ENV_VARS.get("MAIL_FROM", "beaumeteens@gmail.com")
ENV_CLIENT_SECRET = ENV_VARS.get("AZURE_CLIENT_SECRET", "")

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
PUBLIC_IMAGES_PATH = Path(__file__).parent.parent.parent / "public" / "images"
if DIST_PATH.exists():
    @app.middleware("http")
    async def add_cache_headers(request, call_next):
        response = await call_next(request)
        # Cache static assets for 1 year
        if request.url.path.startswith("/assets/"):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response
    # Serve assets only to avoid overriding API routes in dev
    app.mount("/assets", StaticFiles(directory=str(DIST_PATH / "assets")), name="assets")

# Always serve uploaded images from public/images
try:
    PUBLIC_IMAGES_PATH.mkdir(parents=True, exist_ok=True)
    app.mount("/images", StaticFiles(directory=str(PUBLIC_IMAGES_PATH)), name="images")
except Exception as e:
    print(f"Warning: Failed to mount /images static: {e}")

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

def write_env(new_values: dict[str, str]):
    """Persist provided keys to .env and refresh in-memory defaults."""
    # Update ENV_VARS with provided values
    for k, v in new_values.items():
        if v is None:
            continue
        ENV_VARS[k] = v
    # Write back to .env preserving simple KEY=value format
    try:
        lines = []
        # Ensure keys exist
        for key in ["AZURE_CLIENT_ID", "AZURE_TENANT_ID", "MAIL_FROM", "AZURE_CLIENT_SECRET"]:
            val = ENV_VARS.get(key, "")
            lines.append(f"{key}={val}\n")
        ENV_PATH.write_text("".join(lines), encoding="utf-8")
    except Exception as e:
        print(f"Warning: Failed to write .env: {e}")
    # Refresh module-level defaults
    global ENV_CLIENT_ID, ENV_TENANT_ID, ENV_MAIL_FROM
    ENV_CLIENT_ID = ENV_VARS.get("AZURE_CLIENT_ID", ENV_CLIENT_ID)
    ENV_TENANT_ID = ENV_VARS.get("AZURE_TENANT_ID", ENV_TENANT_ID)
    ENV_MAIL_FROM = ENV_VARS.get("MAIL_FROM", ENV_MAIL_FROM)

class ConfigResponse(BaseModel):
    azure_client_id: str | None = None
    azure_tenant_id: str | None = None
    mail_from: EmailStr | None = None

class ConfigUpdate(BaseModel):
    azure_client_id: str | None = None
    azure_tenant_id: str | None = None
    mail_from: EmailStr | None = None

def get_access_token(client_id: str | None, tenant_id: str | None) -> str:
    """Get cached access token with automatic refresh. Raises 401 if not authenticated."""
    client_id = client_id or ENV_CLIENT_ID
    tenant_id = tenant_id or ENV_TENANT_ID
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
    
    # Use cached access token if present (no refresh for public client)
    if "access_token" in token_data:
        return token_data["access_token"]
    
    raise HTTPException(
        status_code=401,
        detail="Authentication expired. Please re-authenticate via Settings."
    )

class AuthInitRequest(BaseModel):
    azure_client_id: str | None = None
    azure_tenant_id: str | None = None
    azure_client_secret: str | None = None

class AuthInitResponse(BaseModel):
    user_code: str
    verification_uri: str
    message: str
    expires_in: int

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/config", response_model=ConfigResponse)
async def get_config():
    """Return current server-side configuration values."""
    return ConfigResponse(
        azure_client_id=ENV_CLIENT_ID or None,
        azure_tenant_id=ENV_TENANT_ID or None,
        mail_from=ENV_MAIL_FROM or None,
    )

@app.post("/config", response_model=ConfigResponse)
async def update_config(payload: ConfigUpdate):
    """Update server-side .env values and clear token cache to force re-auth."""
    to_write = {}
    if payload.azure_client_id is not None:
        to_write["AZURE_CLIENT_ID"] = payload.azure_client_id
    if payload.azure_tenant_id is not None:
        to_write["AZURE_TENANT_ID"] = payload.azure_tenant_id
    if payload.mail_from is not None:
        to_write["MAIL_FROM"] = str(payload.mail_from)
    write_env(to_write)
    # Clear token cache so updated IDs require fresh auth
    try:
        if TOKEN_CACHE_FILE.exists():
            TOKEN_CACHE_FILE.unlink(missing_ok=True)
        _token_cache.clear()
    except Exception:
        pass
    return await get_config()

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

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload a generic image for campaigns/templates and save to public/images."""
    images_dir = Path(__file__).parent.parent.parent / "public" / "images"
    images_dir.mkdir(parents=True, exist_ok=True)

    ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"uploaded-{timestamp}.{ext}"
    file_path = images_dir / filename

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"path": f"/images/{filename}"}

@app.post("/auth/init", response_model=AuthInitResponse)
async def auth_init(payload: AuthInitRequest):
    """Initiate device code flow (for personal accounts) or use client credentials flow (for business accounts)."""
    tenant_id = payload.azure_tenant_id or ENV_TENANT_ID
    client_id = payload.azure_client_id or ENV_CLIENT_ID
    client_secret = payload.azure_client_secret or ENV_CLIENT_SECRET
    authority = f"https://login.microsoftonline.com/{tenant_id}"
    
    # For business accounts with client secret: use client credentials flow (no user interaction)
    if client_secret:
        app_msal = msal.ConfidentialClientApplication(
            client_id=client_id,
            client_credential=client_secret,
            authority=authority,
        )
        # Client credentials flow requires /.default suffix
        scopes = ["https://graph.microsoft.com/.default"]
        
        # Acquire token directly using client credentials
        result = app_msal.acquire_token_for_client(scopes=scopes)
        if "access_token" not in result:
            error_msg = result.get("error_description", "Authentication failed")
            print(f"[auth_init] Client credentials auth failed: {error_msg}")
            raise HTTPException(status_code=401, detail=f"Azure auth failed: {error_msg}")
        
        # Store token and mark as authenticated
        cache_key = f"{client_id}:{tenant_id}"
        _token_cache[cache_key] = result
        save_token_cache(_token_cache)
        
        # Return a success response (no device code needed)
        return AuthInitResponse(
            user_code="authenticated",
            verification_uri="",
            message="Successfully authenticated with client credentials",
            expires_in=3600
        )
    
    # For personal accounts: use device flow (requires user interaction)
    app_msal = msal.PublicClientApplication(
        client_id=client_id,
        authority=authority,
    )
    
    # Device flow uses individual scopes
    scopes = ["https://graph.microsoft.com/User.Read", "https://graph.microsoft.com/Mail.Send"]
    
    flow = app_msal.initiate_device_flow(scopes=scopes)
    if "user_code" not in flow:
        raise HTTPException(status_code=500, detail="Failed to create device flow")
    
    # Store flow for completion
    cache_key = f"{client_id}:{tenant_id}"
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
    client_id = payload.azure_client_id or ENV_CLIENT_ID
    tenant_id = payload.azure_tenant_id or ENV_TENANT_ID
    cache_key = f"{client_id}:{tenant_id}"
    flow_data = _token_cache.get(f"{cache_key}:flow")
    
    if not flow_data:
        raise HTTPException(status_code=400, detail="No pending authentication flow")
    
    app_msal, flow = flow_data
    
    result = app_msal.acquire_token_by_device_flow(flow)
    
    if "access_token" not in result:
        error_msg = result.get("error_description", "Authentication failed")
        print(f"[auth_complete] Failed: {error_msg}")
        raise HTTPException(status_code=401, detail=error_msg)
    
    # Store full token response (includes refresh_token for auto-refresh)
    _token_cache[cache_key] = result
    del _token_cache[f"{cache_key}:flow"]
    
    # Persist token to disk
    save_token_cache(_token_cache)
    
    print(f"[auth_complete] Success. Scopes: {result.get('scope', 'none')}")
    return {"status": "authenticated", "scopes": result.get("scope", "")}

@app.get("/auth/status")
async def auth_status(client_id: str, tenant_id: str):
    """Check auth state: pending flow vs authenticated."""
    client_id = client_id or ENV_CLIENT_ID
    tenant_id = tenant_id or ENV_TENANT_ID
    cache_key = f"{client_id}:{tenant_id}"
    # Pending device flow
    if f"{cache_key}:flow" in _token_cache:
        return {"authenticated": False, "checking": True}
    # No tokens yet
    if cache_key not in _token_cache:
        return {"authenticated": False, "checking": False}
    
    token_data = _token_cache[cache_key]
    
    # Check if we have token data
    if isinstance(token_data, str):
        return {"authenticated": True, "checking": False}
    elif "access_token" in token_data:
        return {"authenticated": True, "checking": False}
    return {"authenticated": False, "checking": False}

@app.post("/send/mail")
async def send_mail(payload: SendMailBody):
    """Send email via Microsoft Graph API."""
    client_id = payload.azure_client_id or ENV_CLIENT_ID
    tenant_id = payload.azure_tenant_id or ENV_TENANT_ID
    mail_from = str(payload.mail_from or ENV_MAIL_FROM)
    
    try:
        # Get access token
        access_token = get_access_token(client_id, tenant_id)
        print(f"[send_mail] Using token (first 20 chars): {access_token[:20]}...")
        
        # First verify token works and check mailbox
        async with httpx.AsyncClient() as client:
            me_response = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0
            )
            if me_response.status_code == 200:
                me_data = me_response.json()
                user_principal = me_data.get('userPrincipalName', 'unknown')
                print(f"[send_mail] Token valid. User: {user_principal}")
                
                # Check if this is a guest account (contains #EXT#)
                if "#EXT#" in user_principal:
                    raise HTTPException(
                        status_code=403,
                        detail="Cannot send mail: You are signed in as a guest account. Guest accounts do not have mailboxes. Please sign in with a user account from your organization (e.g., yourname@yourdomain.onmicrosoft.com) or create one in Azure AD."
                    )
                
                # Check if user has a mailbox by trying to access mailbox settings
                # Skip for personal accounts (consumers tenant) as they always have mailboxes
                if tenant_id != "consumers":
                    mailbox_response = await client.get(
                        "https://graph.microsoft.com/v1.0/me/mailboxSettings",
                        headers={"Authorization": f"Bearer {access_token}"},
                        timeout=10.0
                    )
                    if mailbox_response.status_code == 404:
                        print(f"[send_mail] Mailbox check failed: {mailbox_response.status_code}")
                        raise HTTPException(
                            status_code=403,
                            detail="Cannot send mail: The account does not have an Exchange Online mailbox. Please assign a Microsoft 365 license (E1/E3/E5) to this user in the Azure Portal under 'Licenses'."
                        )
                    print(f"[send_mail] Mailbox exists for user {user_principal}")
            else:
                print(f"[send_mail] Token validation failed: {me_response.status_code} - {me_response.text}")
        
        # Prepare email payload for Microsoft Graph
        # Detect if body is HTML (contains HTML tags) or plain text
        is_html = bool(payload.body and ("<div" in payload.body or "<p" in payload.body or "<html" in payload.body))

        message_body_content = payload.body
        attachments: list[dict] = []

        if is_html:
            # Find all local image sources  
            img_srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', message_body_content or "")
            
            async with httpx.AsyncClient() as client:
                img_counter = 0
                for src in img_srcs:
                    try:
                        if src.startswith('data:'):
                            continue
                        
                        src_url = src
                        if src.startswith('/images/'):
                            src_url = f"http://localhost:8000{src}"
                        elif not src.startswith('http://localhost:8000'):
                            continue
                        
                        print(f"[send_mail] Fetching image: {src_url}")
                        r = await client.get(src_url, timeout=10.0)
                        if r.status_code == 200:
                            content_bytes = r.content
                            ct = r.headers.get('Content-Type', 'image/png')
                            
                            # Get filename from URL
                            filename = src_url.split('/')[-1]
                            
                            # Generate unique Content-ID (must be unique, can't have special chars except @ and .)
                            # Format: uniqueid@domain
                            content_id = f"{filename.split('.')[0]}{img_counter}@local"
                            img_counter += 1
                            
                            # Convert to base64
                            b64_data = base64.b64encode(content_bytes).decode('ascii')
                            
                            # Add as inline attachment
                            # Note: Graph API docs show contentId is read-only and assigned by Exchange
                            # But for sendMail endpoint, we can set it for inline images
                            attachments.append({
                                "@odata.type": "#microsoft.graph.fileAttachment",
                                "name": filename,
                                "contentType": ct,
                                "contentBytes": b64_data,
                                "contentId": content_id,
                                "isInline": True
                            })
                            
                            # Replace image src with cid: reference (no angle brackets)
                            message_body_content = message_body_content.replace(src, f"cid:{content_id}")
                            print(f"[send_mail] Added inline attachment: {filename} with CID: cid:{content_id}")
                    except Exception as e:
                        print(f"[send_mail] Image fetch error for {src}: {e}")

        # Ensure we're sending as HTML
        content_type = "HTML" if is_html else "Text"
        print(f"[send_mail] Sending as: {content_type}, Body length: {len(message_body_content)} chars, Attachments: {len(attachments)}")
        
        # Debug: Print the HTML body to see CID references
        if attachments:
            print(f"[send_mail] HTML body preview (first 500 chars):\n{message_body_content[:500]}")
        
        graph_payload = {
            "message": {
                "subject": payload.subject,
                "body": {
                    "contentType": content_type,
                    "content": message_body_content
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
        
        # Add inline attachments if any
        if attachments:
            graph_payload["message"]["attachments"] = attachments
        
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
                print(f"[send_mail] Full response status: {response.status_code}")
                print(f"[send_mail] Response headers: {dict(response.headers)}")
                print(f"[send_mail] Response body: {error_detail}")
                
                # Special handling for 401 with empty body (typically mailbox not found)
                if response.status_code == 401 and not error_detail:
                    raise HTTPException(
                        status_code=403,
                        detail="Cannot send mail: The authenticated account does not have an Exchange Online mailbox. Please ensure you're signed in with an account that has email enabled in your Microsoft 365 tenant."
                    )
                
                try:
                    error_json = response.json()
                    error_msg = error_json.get('error', {}).get('message', error_detail)
                    print(f"[send_mail] Parsed error message: {error_msg}")
                except Exception as parse_err:
                    print(f"[send_mail] Could not parse JSON: {parse_err}")
                    error_msg = error_detail if error_detail else "Unknown error (empty response)"
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Graph API error: {error_msg}"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


class AuthTestBody(BaseModel):
    azure_client_id: str | None = None
    azure_tenant_id: str | None = None
    mail_from: EmailStr | None = None
    to: EmailStr | None = None
    send_test_email: bool | None = False


@app.post("/auth/test")
async def auth_test(payload: AuthTestBody):
    """Validate credentials: confirm token usable; optionally send a test email."""
    client_id = payload.azure_client_id or ENV_CLIENT_ID
    tenant_id = payload.azure_tenant_id or ENV_TENANT_ID
    try:
        token = get_access_token(client_id, tenant_id)
    except HTTPException as e:
        return {"authenticated": False, "error": "Not authenticated or token invalid"}

    if payload.send_test_email:
        test_to = str(payload.to or payload.mail_from or ENV_MAIL_FROM)
        test_payload = SendMailBody(
            to=test_to,
            subject="[Credential Test] Mail.Send scope check",
            body="This is a test email to validate Mail.Send permission.",
            azure_client_id=client_id,
            azure_tenant_id=tenant_id,
            mail_from=payload.mail_from or ENV_MAIL_FROM,
        )
        # Reuse send_mail logic via Graph API
        graph_payload = {
            "message": {
                "subject": test_payload.subject,
                "body": {"contentType": "Text", "content": test_payload.body},
                "toRecipients": [{"emailAddress": {"address": test_payload.to}}],
            },
            "saveToSentItems": "true",
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://graph.microsoft.com/v1.0/me/sendMail",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=graph_payload,
                timeout=30.0,
            )
            if response.status_code != 202:
                # Return a simple invalid status instead of raising
                return {"authenticated": False, "mail_send": False, "error": "Graph API error"}
        return {"authenticated": True, "mail_send": True}

    return {"authenticated": True}
