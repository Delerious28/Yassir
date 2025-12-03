import os
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).parent
BACKEND = ROOT / "backend"
VENV = BACKEND / ".venv"
FRONTEND = ROOT
NODE_DIR = ROOT / ".node"
SETUP_COMPLETE_FLAG = ROOT / ".setup_complete"


def check_setup():
    """Check if initial setup has been completed."""
    if not SETUP_COMPLETE_FLAG.exists():
        print("[run] First time setup required!")
        print("[run] Please run: python setup.py")
        sys.exit(1)
    
    # Quick checks
    if not (VENV / "Scripts" / "python.exe").exists():
        print("[run] Backend environment missing. Running setup...")
        run_setup()
        return
    
    if not (NODE_DIR / "node.exe").exists():
        print("[run] Node.js missing. Running setup...")
        run_setup()
        return
    
    if not (FRONTEND / "node_modules").exists():
        print("[run] Frontend packages missing. Running setup...")
        run_setup()
        return


def run_setup():
    """Run the setup script."""
    subprocess.check_call([sys.executable, "setup.py"], cwd=str(ROOT))


def run_uvicorn():
    python_exe = VENV / "Scripts" / "python.exe"
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    cmd = [str(python_exe), "-m", "uvicorn", "app.main:app", "--port", "8000"]
    print("[run] Starting backend on http://127.0.0.1:8000")
    return subprocess.Popen(cmd, cwd=str(BACKEND), env=env)


def run_frontend():
    node_path = str(NODE_DIR)
    env = os.environ.copy()
    env["PATH"] = f"{node_path};{env['PATH']}"
    npm_cmd = os.path.join(node_path, "npm.cmd")
    
    print("[run] Starting frontend on http://localhost:5173")
    return subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(FRONTEND), shell=True, env=env)


def wait_for_server(host, port, name, path="/", max_attempts=40):
    """Wait for a server to be ready."""
    import http.client
    print(f"[run] Waiting for {name}...")
    
    for i in range(max_attempts):
        try:
            conn = http.client.HTTPConnection(host, port, timeout=1)
            conn.request("GET", path)
            resp = conn.getresponse()
            resp.read()
            conn.close()
            if resp.status == 200:
                print(f"[run] {name} ready!")
                return True
        except Exception:
            pass
        time.sleep(0.25)
    
    print(f"[run] Warning: {name} did not respond in time.")
    return False


def main():
    try:
        # Check setup
        check_setup()
        
        # Start backend
        p_backend = run_uvicorn()
        wait_for_server("127.0.0.1", 8000, "Backend", "/health")
        
        # Start frontend
        p_frontend = run_frontend()
        wait_for_server("localhost", 5173, "Frontend", "/")
        
        # Open browser
        url = "http://localhost:5173"
        print(f"[run] Opening {url}")
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"[run] Could not open browser: {e}")
        
        print("\n" + "=" * 60)
        print("APP IS RUNNING")
        print("=" * 60)
        print("Backend:  http://127.0.0.1:8000")
        print("Frontend: http://localhost:5173")
        print("\nPress Ctrl+C to stop.")
        print("=" * 60 + "\n")
        
        # Monitor processes
        while True:
            ret_b = p_backend.poll()
            ret_f = p_frontend.poll()
            
            if ret_b is not None:
                print(f"\n[run] Backend exited with code {ret_b}")
                if ret_b != 0:
                    print("[run] Backend error detected. You may need to run: python setup.py")
                break
            
            if ret_f is not None:
                print(f"\n[run] Frontend exited with code {ret_f}")
                if ret_f != 0:
                    print("[run] Frontend error detected. You may need to run: python setup.py")
                break
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n[run] Stopping...")
    except Exception as e:
        print(f"\n[run] Error: {e}")
        print("[run] If issues persist, try running: python setup.py")
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
