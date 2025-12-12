import os
import subprocess
import sys
import time
import webbrowser
import urllib.request
import zipfile
import shutil
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent
BACKEND = ROOT / "backend"
VENV = BACKEND / ".venv"
FRONTEND = ROOT
NODE_DIR = ROOT / ".node"
NODE_VERSION = "20.11.0"
SETUP_COMPLETE_FLAG = ROOT / ".setup_complete"


def ensure_node():
    """Download and setup Node.js if not present."""
    node_exe = NODE_DIR / "node.exe"
    npm_cmd = NODE_DIR / "npm.cmd"
    
    if node_exe.exists() and npm_cmd.exists():
        print("[start] Node.js already installed.")
        return str(NODE_DIR)
    
    print("[start] Node.js not found. Downloading portable Node.js...")
    NODE_DIR.mkdir(exist_ok=True)
    
    # Download portable Node.js for Windows
    node_url = f"https://nodejs.org/dist/v{NODE_VERSION}/node-v{NODE_VERSION}-win-x64.zip"
    zip_path = NODE_DIR / "node.zip"
    
    try:
        print(f"[start] Downloading from {node_url}...")
        urllib.request.urlretrieve(node_url, zip_path)
        
        print("[start] Extracting Node.js...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(NODE_DIR)
        
        # Move files from the extracted folder to NODE_DIR
        extracted_folder = NODE_DIR / f"node-v{NODE_VERSION}-win-x64"
        if extracted_folder.exists():
            for item in extracted_folder.iterdir():
                shutil.move(str(item), str(NODE_DIR / item.name))
            extracted_folder.rmdir()
        
        # Cleanup
        zip_path.unlink()
        
        print("[start] Node.js installed successfully.")
        return str(NODE_DIR)
    except Exception as e:
        print(f"[start] Error downloading Node.js: {e}")
        print("[start] Please install Node.js manually from https://nodejs.org")
        sys.exit(1)


def needs_setup():
    """Check if full setup is needed."""
    # If flag doesn't exist, definitely need setup
    if not SETUP_COMPLETE_FLAG.exists():
        return True
    
    # Quick checks for critical components
    if not (VENV / "Scripts" / "python.exe").exists():
        return True
    
    if not (NODE_DIR / "node.exe").exists():
        return True
    
    if not (FRONTEND / "node_modules").exists():
        return True
    
    return False


def run_full_setup():
    """Run complete setup process."""
    print("\n" + "=" * 60)
    print("FIRST TIME SETUP")
    print("=" * 60)
    
    # Setup Node.js
    node_path = ensure_node()
    
    # Setup Python backend
    ensure_venv()
    install_backend_packages()
    
    # Setup frontend
    install_frontend_packages(node_path)
    
    # Clean cache
    clean_vite_cache()
    
    # Mark setup complete
    SETUP_COMPLETE_FLAG.touch()
    
    print("\n" + "=" * 60)
    print("SETUP COMPLETE!")
    print("=" * 60 + "\n")


def ensure_venv():
    if not VENV.exists():
        print("[start] Creating backend virtual environment...")
        subprocess.check_call([sys.executable, "-m", "venv", str(VENV)])


def install_backend_packages():
    print("[start] Installing backend packages...")
    python_exe = VENV / "Scripts" / "python.exe"
    try:
        subprocess.check_call([str(python_exe), "-m", "pip", "install", "-r", "requirements.txt", "--upgrade-strategy", "only-if-needed"], cwd=str(BACKEND))
        subprocess.check_call([str(python_exe), "-m", "pip", "install", "pydantic[email]", "--upgrade-strategy", "only-if-needed"], cwd=str(BACKEND))
    except subprocess.CalledProcessError as e:
        print(f"[start] Warning: Package install issue: {e}")


def install_frontend_packages(node_path):
    env = os.environ.copy()
    env["PATH"] = f"{node_path};{env['PATH']}"
    npm_cmd = os.path.join(node_path, "npm.cmd")
    
    if not (FRONTEND / "node_modules").exists():
        print("[start] Installing frontend dependencies...")
        subprocess.check_call([npm_cmd, "install"], cwd=str(FRONTEND), env=env)


def clean_vite_cache():
    """Clean Vite cache to prevent permission issues."""
    vite_cache = FRONTEND / "node_modules" / ".vite"
    if vite_cache.exists():
        try:
            shutil.rmtree(vite_cache, ignore_errors=True)
            print("[start] Cleaned Vite cache.")
        except Exception:
            pass


def run_uvicorn():
    python_exe = VENV / "Scripts" / "python.exe"
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    cmd = [str(python_exe), "-m", "uvicorn", "app.main:app", "--port", "8000"]
    print("[start] Starting backend...")
    return subprocess.Popen(cmd, cwd=str(BACKEND), env=env)


def check_and_prompt_auth(client_id: str, tenant_id: str):
    """Check backend auth status; if not connected, initiate device flow and print code+URL."""
    import http.client
    import json as _json
    # Try status first
    try:
        conn = http.client.HTTPConnection("127.0.0.1", 8000, timeout=2)
        path = f"/auth/status?client_id={client_id}&tenant_id={tenant_id}"
        conn.request("GET", path)
        resp = conn.getresponse()
        data = _json.loads(resp.read().decode("utf-8"))
        conn.close()
        if data.get("authenticated"):
            print("[start] Azure auth: connected.")
            return True
        else:
            print("[start] Azure auth: not connected. Initiating device flow...")
    except Exception:
        print("[start] Warning: Could not check auth status.")

    # Initiate device flow
    try:
        payload = _json.dumps({
            "azure_client_id": client_id,
            "azure_tenant_id": tenant_id,
        }).encode("utf-8")
        conn = http.client.HTTPConnection("127.0.0.1", 8000, timeout=5)
        conn.request("POST", "/auth/init", body=payload, headers={"Content-Type": "application/json"})
        resp = conn.getresponse()
        init_data = _json.loads(resp.read().decode("utf-8"))
        conn.close()
        code = init_data.get("user_code")
        url = init_data.get("verification_uri")
        if code and url:
            print("\n" + "=" * 50)
            print("AZURE SIGN-IN REQUIRED")
            print("=" * 50)
            print(f"Verification URL: {url}")
            print(f"Device Code     : {code}")
            print("Enter the code at the URL to complete sign-in.")
            print("=" * 50 + "\n")
            try:
                webbrowser.open(url)
            except Exception:
                pass
            return False
    except Exception as e:
        print(f"[start] Failed to initiate device flow: {e}")
    return False


def run_frontend():
    node_path = str(NODE_DIR)
    env = os.environ.copy()
    env["PATH"] = f"{node_path};{env['PATH']}"
    env["CONSOLE_NINJA_ENABLED"] = "false"  # Disable Console Ninja extension
    npm_cmd = os.path.join(node_path, "npm.cmd")
    
    print("[start] Starting frontend...")
    return subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(FRONTEND), shell=True, env=env)


def wait_for_server(host, port, name, path="/", max_attempts=40):
    """Wait for a server to be ready."""
    import http.client
    
    for i in range(max_attempts):
        try:
            conn = http.client.HTTPConnection(host, port, timeout=1)
            conn.request("GET", path)
            resp = conn.getresponse()
            resp.read()
            conn.close()
            if resp.status == 200:
                print(f"[start] {name} ready!")
                return True
        except Exception:
            pass
        time.sleep(0.25)
    
    print(f"[start] {name} taking longer than expected...")
    return False


def main():
    try:
        start_time = time.time()
        print(f"\n[{time.strftime('%H:%M:%S')}] Script started")
        
        # Kill any orphaned processes from previous runs
        cleanup_start = time.time()
        try:
            subprocess.run(["taskkill", "/F", "/IM", "node.exe"], 
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(["taskkill", "/F", "/IM", "python.exe", "/FI", "WINDOWTITLE eq *uvicorn*"], 
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(1)  # Wait for processes to fully terminate
        except Exception:
            pass
        print(f"[{time.strftime('%H:%M:%S')}] Cleanup: {time.time() - cleanup_start:.2f}s")
        
        # Rename Vite cache to avoid permission issues (Vite will create fresh cache)
        vite_cache = FRONTEND / "node_modules" / ".vite"
        if vite_cache.exists():
            try:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                old_cache = FRONTEND / "node_modules" / f".vite_old_{timestamp}"
                vite_cache.rename(old_cache)
            except Exception:
                pass  # If rename fails, Vite will handle it
        
        # Check if we need to run full setup
        if needs_setup():
            setup_start = time.time()
            run_full_setup()
            print(f"[{time.strftime('%H:%M:%S')}] Setup complete: {time.time() - setup_start:.2f}s")
        
        # Start servers immediately
        print(f"[{time.strftime('%H:%M:%S')}] Starting servers...")
        
        p_backend = run_uvicorn()
        p_frontend = run_frontend()
        
        # Wait for backend and perform auth check before opening browser
        # Wait for backend health endpoint to avoid 404s on root
        wait_for_server("127.0.0.1", 8000, "Backend", "/health")
        # Skip automatic device flow prompt; user will press Connect in UI

        # Quick wait for frontend to be ready before opening browser
        print(f"[{time.strftime('%H:%M:%S')}] Waiting for frontend...")
        frontend_start = time.time()
        wait_for_server("localhost", 5173, "Frontend", "/")
        print(f"[{time.strftime('%H:%M:%S')}] Frontend ready: {time.time() - frontend_start:.2f}s")
        
        url = "http://localhost:5173"
        print(f"Opening {url}")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        
        print("\n" + "=" * 50)
        print("APP RUNNING")
        print("=" * 50)
        print("Backend:  http://127.0.0.1:8000")
        print("Frontend: http://localhost:5173")
        print("Press Ctrl+C to stop")
        print("=" * 50 + "\n")
        
        # Monitor processes
        while True:
            ret_b = p_backend.poll()
            ret_f = p_frontend.poll()
            
            if ret_b is not None:
                print(f"\n[start] Backend exited with code {ret_b}")
                if ret_b != 0:
                    print("[start] Backend error detected. Deleting .setup_complete to trigger fresh setup on next run.")
                    SETUP_COMPLETE_FLAG.unlink(missing_ok=True)
                break
            
            if ret_f is not None:
                print(f"\n[start] Frontend exited with code {ret_f}")
                if ret_f != 0:
                    print("[start] Frontend error detected. Deleting .setup_complete to trigger fresh setup on next run.")
                    SETUP_COMPLETE_FLAG.unlink(missing_ok=True)
                break
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n[start] Stopping...")
    except Exception as e:
        print(f"\n[start] Error: {e}")
        print("[start] Deleting .setup_complete to trigger fresh setup on next run.")
        SETUP_COMPLETE_FLAG.unlink(missing_ok=True)
    finally:
        try:
            p_backend.terminate()
        except Exception:
            pass
        try:
            p_frontend.terminate()
        except Exception:
            pass


if __name__ == "__main__":
    main()
