import os
import json
import socket
import time
import requests
import psutil
import platform
import urllib3
import sys

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SHARED_SECRET = "MySecureProjectPassword2026!"
CONFIG_FILE = os.path.join(SCRIPT_DIR, "agent_config.json")
SETTINGS_FILE = os.path.join(SCRIPT_DIR, "agent_settings.json")

# Default to localhost, but try to load from settings
SERVER_API = "http://127.0.0.1:5001/api"

# 1. Load from settings file if it exists
if os.path.exists(SETTINGS_FILE):
    try:
        with open(SETTINGS_FILE, "r") as f:
            settings = json.load(f)
            if "server_url" in settings:
                SERVER_API = settings["server_url"]
    except Exception as e:
        print(f"⚠️ Failed to load settings: {e}")

# 2. Override with command-line argument if provided
if len(sys.argv) > 1:
    arg = sys.argv[1]
    if arg.startswith("http"):
        SERVER_API = arg
    else:
        # Assume it's just an IP or hostname
        SERVER_API = f"http://{arg}:5001/api"
    print(f"🎮 Command-line override: {SERVER_API}")

# 3. Normalization: Ensure no trailing slash and includes /api
if SERVER_API.endswith('/'): 
    SERVER_API = SERVER_API[:-1]
if not SERVER_API.endswith('/api'): 
    SERVER_API += "/api"

print(f"🔗 Using Server API: {SERVER_API}")

def get_os_info():
    try:
        return f"{platform.system()} {platform.release()} ({platform.machine()})"
    except:
        return "Unknown OS"

def register_with_server():
    """Performs the first-time handshake with the server."""
    hostname = socket.gethostname()
    os_info = get_os_info()
    print(f"🔵 Attempting to register {hostname} ({os_info})...")

    payload = {
        "hostname": hostname,
        "password": SHARED_SECRET,
        "os_info": os_info
    }

    try:
        print(f"📡 Sending registration request to {SERVER_API}/enroll...")
        response = requests.post(f"{SERVER_API}/enroll", json=payload, timeout=10, verify=False)
        
        if response.status_code == 200:
            creds = response.json()
            # Save the received ID and Key locally
            with open(CONFIG_FILE, "w") as f:
                json.dump(creds, f)
            print(f"✅ Registration Success! Assigned ID: {creds['agent_id']}")
            return creds
        else:
            print(f"❌ Registration Failed (HTTP {response.status_code}): {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Could not reach server at {SERVER_API}.")
        print(f"   Please check if the Server is running and accessible from this machine.")
        return None
    except Exception as e:
        print(f"❌ Registration Error: {e}")
        return None
def collect_logs():
    """Simulates collecting process events"""
    logs = []
    # Get a few running processes
    for proc in psutil.process_iter(['pid', 'name', 'username', 'cmdline']):
        try:
            pinfo = proc.info
            cmd = " ".join(pinfo['cmdline']) if pinfo['cmdline'] else ""
            
            logs.append({
                "process_name": pinfo['name'],
                "command_line": cmd,
                "user": pinfo['username']
            })
            
            if len(logs) >= 5: break # Send in batches of 5
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    return logs

def start_monitoring():
    # 1. Check if we are already registered
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)
        except Exception as e:
            print(f"⚠️ Failed to load config: {e}. Re-registering...")
            config = register_with_server()
    else:
        # If not, try to register
        config = register_with_server()
    
    if not config or 'agent_id' not in config:
        print("❌ Agent could not be initialized. Stopping.")
        return

    # 2. Main Loop
    print("🚀 Agent started monitoring...")
    while True:
        try:
            # Gather Telemetry
            telemetry = {
                "agent_id": config['agent_id'],
                "cpu": psutil.cpu_percent(),
                "ram": psutil.virtual_memory().percent,
                "disk": psutil.disk_usage(os.path.abspath(os.sep)).percent
            }
        except Exception as e:
            print(f"⚠️ Telemetry gathering error: {e}")
            telemetry = {
                "agent_id": config['agent_id'],
                "cpu": 0,
                "ram": 0,
                "disk": 0
            }
        
        # Gather Logs
        logs = collect_logs()

        # Send Data to Server
        try:
            # Send Telemetry
            requests.post(f"{SERVER_API}/telemetry", json=telemetry, timeout=5, verify=False)
            print(f"📡 Sent Telemetry: CPU {telemetry['cpu']}%")

            # Send Logs
            if logs:
                requests.post(f"{SERVER_API}/logs", json={"agent_id": config['agent_id'], "logs": logs}, timeout=5, verify=False)
                print(f"📝 Sent {len(logs)} log events")

        except requests.exceptions.ConnectionError:
            print(f"❌ Connection Error: Could not reach server at {SERVER_API}.")
            print(f"   Check your network connection and server IP.")
        except Exception as e:
             print(f"❌ Network Error during data transmission: {e}")

        time.sleep(10)

if __name__ == "__main__":
    start_monitoring()
