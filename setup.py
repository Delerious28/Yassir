import os
import subprocess
import sys
import urllib.request
import zipfile
import shutil
from pathlib import Path

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
        print("[setup] Node.js already installed.")
        return str(NODE_DIR)
    
    print("[setup] Node.js not found. Downloading portable Node.js...")
    NODE_DIR.mkdir(exist_ok=True)
    
    node_url = f"https://nodejs.org/dist/v{NODE_VERSION}/node-v{NODE_VERSION}-win-x64.zip"
    zip_path = NODE_DIR / "node.zip"
    
    try:
        print(f"[setup] Downloading from {node_url}...")
        urllib.request.urlretrieve(node_url, zip_path)
        
        print("[setup] Extracting Node.js...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(NODE_DIR)
        
        extracted_folder = NODE_DIR / f"node-v{NODE_VERSION}-win-x64"
        if extracted_folder.exists():
            for item in extracted_folder.iterdir():
                shutil.move(str(item), str(NODE_DIR / item.name))
            extracted_folder.rmdir()
        
        zip_path.unlink()
        print("[setup] Node.js installed successfully.")
        return str(NODE_DIR)
    except Exception as e:
        print(f"[setup] Error downloading Node.js: {e}")
        print("[setup] Please install Node.js manually from https://nodejs.org")
        sys.exit(1)


def ensure_venv():
    if not VENV.exists():
        print("[setup] Creating backend virtual environment...")
        subprocess.check_call([sys.executable, "-m", "venv", str(VENV)])


def install_backend_packages():
    print("[setup] Installing backend packages...")
    python_exe = VENV / "Scripts" / "python.exe"
    try:
        subprocess.check_call([str(python_exe), "-m", "pip", "install", "-r", "requirements.txt", "--upgrade-strategy", "only-if-needed"], cwd=str(BACKEND))
        subprocess.check_call([str(python_exe), "-m", "pip", "install", "pydantic[email]", "--upgrade-strategy", "only-if-needed"], cwd=str(BACKEND))
        print("[setup] Backend packages installed.")
    except subprocess.CalledProcessError as e:
        print(f"[setup] Warning: Package install reported an issue: {e}")


def install_frontend_packages(node_path):
    env = os.environ.copy()
    env["PATH"] = f"{node_path};{env['PATH']}"
    npm_cmd = os.path.join(node_path, "npm.cmd")
    
    if not (FRONTEND / "node_modules").exists():
        print("[setup] Installing frontend dependencies...")
        subprocess.check_call([npm_cmd, "install"], cwd=str(FRONTEND), env=env)
        print("[setup] Frontend packages installed.")
    else:
        print("[setup] Frontend packages already installed.")


def clean_vite_cache():
    """Clean Vite cache to prevent permission issues."""
    vite_cache = FRONTEND / "node_modules" / ".vite"
    if vite_cache.exists():
        try:
            shutil.rmtree(vite_cache, ignore_errors=True)
            print("[setup] Cleaned Vite cache.")
        except Exception:
            print("[setup] Could not clean Vite cache (may be in use).")


def main():
    print("=" * 60)
    print("OUTREACH APP SETUP")
    print("=" * 60)
    
    try:
        # Setup Node.js
        node_path = ensure_node()
        
        # Setup Python backend
        ensure_venv()
        install_backend_packages()
        
        # Setup frontend
        install_frontend_packages(node_path)
        
        # Clean cache
        clean_vite_cache()
        
        # Mark setup as complete
        SETUP_COMPLETE_FLAG.touch()
        
        print("\n" + "=" * 60)
        print("SETUP COMPLETE!")
        print("=" * 60)
        print("\nYou can now run: python run.py")
        
    except KeyboardInterrupt:
        print("\n[setup] Setup interrupted.")
        sys.exit(1)
    except Exception as e:
        print(f"\n[setup] Setup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
