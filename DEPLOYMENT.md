# LOTIflow Deployment Guide

**Server**: Ubuntu 20.04 LTS (VirtualBox)  
**Endpoint**: Windows 11  
**Architecture**: `Windows Agent → Ubuntu Server (Docker) → Dashboard`

---

## Architecture Overview

```
┌──────────────────────┐         ┌────────────────────────────────────────────┐
│   Windows 11 PC      │         │  Ubuntu 20.04 VM (VirtualBox)              │
│   (Endpoint)         │         │                                            │
│                      │  HTTP   │  ┌─── Port 8082 ─── Nginx (Proxy) ──┐     │
│  agent_core.py ──────┼────────►│  │   / → Frontend (React)           │     │
│  connect.py          │  :5001  │  │   /api → Backend (Node.js)       │     │
│  install.ps1         │         │  └───────────────────────────────────┘     │
│                      │         │         │                                  │
│  Browser ────────────┼────────►│         ▼                                  │
│  (Dashboard)         │  :8082  │  MySQL 5.7 ── phpMyAdmin (:8083)          │
│                      │         │  Ollama AI (:11435)                        │
└──────────────────────┘         └────────────────────────────────────────────┘
```

---

## Part 1 — Server Setup (Ubuntu 20.04 VM)

### 1.1 VirtualBox Network Configuration

> [!IMPORTANT]
> VirtualBox network mode determines whether Windows can reach the Ubuntu VM.

| Mode | Windows → VM | VM → Internet | Recommended |
|------|-------------|---------------|-------------|
| **Bridged Adapter** | ✅ Yes | ✅ Yes | **Best choice** |
| NAT + Port Forward | ✅ (with rules) | ✅ Yes | Alternative |
| Host-Only | ✅ Yes | ❌ No | Isolated lab |

**Set to Bridged Adapter:**
1. In VirtualBox → select VM → **Settings** → **Network**
2. Adapter 1 → Attached to: **Bridged Adapter**
3. Name: select your active network adapter (Wi-Fi or Ethernet)
4. Start the VM

**Find the VM's IP address:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```
Note this IP (e.g., `192.168.1.50`) — you'll need it throughout.

### 1.2 Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common git

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to the docker group (avoids needing sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### 1.3 Clone & Deploy LOTIflow

```bash
# Clone the repository
cd /opt
sudo git clone <YOUR_GIT_REPOSITORY_URL> lotiflow
cd lotiflow
sudo chown -R $USER:$USER .
```

### 1.4 Open Firewall Ports

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 5001/tcp    # Backend API (agent connection)
sudo ufw allow 8082/tcp    # Dashboard (Nginx proxy)
sudo ufw allow 8083/tcp    # phpMyAdmin (optional)
sudo ufw allow 3001/tcp    # Frontend direct (optional/debug)
sudo ufw enable
sudo ufw status
```

### 1.5 Build & Start Services

```bash
cd /opt/lotiflow

# Build and start all containers
sudo docker compose up -d --build
```

This starts 7 containers:

| Container | Port | Purpose |
|-----------|------|---------|
| `lotiflow-nginx` | 8082 | Reverse proxy (main entry) |
| `lotiflow-frontend` | 3001 | React dashboard |
| `lotiflow-backend` | 5001 | Node.js API server |
| `lotiflow-db` | — | MySQL 5.7 database |
| `lotiflow-engine` | — | Python analysis engine |
| `lotiflow-phpmyadmin` | 8083 | Database admin UI |
| `lotiflow-ollama` | 11435 | AI service |

### 1.6 Verify Server Deployment

```bash
# Check all containers are running
sudo docker compose ps

# Check backend health
curl http://localhost:5001/api/connection/verify

# Expected: {"status":"ok","timestamp":"...","server":"LOTIflow"}

# Check logs if something is wrong
sudo docker compose logs -f backend
```

---

## Part 2 — Dashboard Access (from Windows 11)

### 2.1 Open the Dashboard

On your **Windows 11** machine, open a browser and navigate to:

```
http://<VM_IP>:8082
```

Example: `http://192.168.1.50:8082`

### 2.2 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@securepulse.local | admin |
| Analyst | analyst@securepulse.local | admin |

### 2.3 Verify Dashboard Connectivity

After logging in, navigate to the **User Dashboard** panel:
- You should see the **Connection Verification** banner at the top
- 🟢 **Server Connection Verified** = backend is reachable
- 🔴 **Server Connection Failed** = check if backend container is running

---

## Part 3 — Agent Installation (Windows 11 Endpoint)

### 3.1 Download the Agent

**Option A — From the Dashboard:**
1. In the dashboard, click **ADD COMPUTER**
2. Click **DOWNLOAD AGENT BUNDLE** (downloads `LOTIflow_Agent_Installer.zip`)
3. Extract the zip to a folder (e.g., `C:\LOTIflow-Agent\`)

**Option B — Direct from Git:**
Copy the `agent/` folder from the repository to the Windows machine.

### 3.2 Install Python (if needed)

1. Download Python 3.8+ from [python.org](https://www.python.org/downloads/)
2. During install, **check ✅ "Add Python to PATH"**
3. Verify: open PowerShell → `python --version`

### 3.3 Run the Connection Validator

Open **PowerShell as Administrator**, navigate to the agent folder:

```powershell
cd C:\LOTIflow-Agent

# Run the automated connection validator
python connect.py http://<VM_IP>:5001
```

Example:
```powershell
python connect.py http://192.168.1.50:5001
```

This runs 7 automated checks:
1. ✅ Network connectivity (DNS + TCP)
2. ✅ Server health check
3. ✅ Database connection
4. ✅ Agent enrollment
5. ✅ Telemetry pipeline
6. ✅ Log ingestion
7. ✅ Dashboard data availability

If all pass, it offers to **start the agent automatically**.

### 3.4 Alternative: PowerShell Installer

```powershell
# Right-click install.ps1 → "Run with PowerShell"
# Or from terminal:
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

When prompted for the Server URL, enter:
```
http://<VM_IP>:5001
```

### 3.5 Manual Start (Quick)

```powershell
# Install dependencies
pip install -r requirements.txt

# Start the agent
python agent_core.py http://<VM_IP>:5001
```

### 3.6 Verify Agent Connection

After the agent starts, check:

1. **Agent terminal** should show:
   ```
   🔗 Using Server API: http://192.168.1.50:5001/api
   ✅ Registration Success! Assigned ID: <uuid>
   📡 Sent Telemetry: CPU 15%
   📝 Sent 5 log events
   ```

2. **Dashboard** should show:
   - Status badge changes to 🟢 **CONNECTED**
   - Agent appears in the connection verification banner
   - Logs appear in **Live System Logs** panel

---

## Part 4 — Run Attack Simulation (Demo)

While the agent is running, open a **second PowerShell** window:

```powershell
cd C:\LOTIflow-Agent
python simulate_attack.py
```

This executes common LOTL techniques that trigger detection rules. Check the dashboard for new alerts.

---

## Quick Reference

### Server Commands (Ubuntu VM)

```bash
# Start all services
sudo docker compose up -d

# Stop all services
sudo docker compose down

# View logs
sudo docker compose logs -f backend

# Rebuild after code changes
sudo docker compose up -d --build

# Check VM IP
ip addr show | grep "inet " | grep -v 127.0.0.1

# Reset database (destructive!)
sudo docker compose down -v
sudo docker compose up -d --build
```

### Agent Commands (Windows 11)

```powershell
# Validate connection
python connect.py http://<VM_IP>:5001

# Start agent
python agent_core.py http://<VM_IP>:5001

# Run attack simulation
python simulate_attack.py
```

### Access URLs (replace `<VM_IP>`)

| Service | URL |
|---------|-----|
| Dashboard | `http://<VM_IP>:8082` |
| Backend API | `http://<VM_IP>:5001/api` |
| phpMyAdmin | `http://<VM_IP>:8083` |
| Health Check | `http://<VM_IP>:5001/api/connection/verify` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Can't reach VM from Windows** | Check VirtualBox is set to **Bridged Adapter**. Ping the VM IP from Windows: `ping <VM_IP>` |
| **Agent shows "Connection Error"** | Verify port 5001 is open: `sudo ufw status`. Check backend is running: `sudo docker compose ps` |
| **Dashboard shows DISCONNECTED** | Agent isn't sending telemetry. Restart agent with correct IP. Check `agent_settings.json` has the right URL |
| **Docker permission denied** | Run with `sudo` or add user to docker group: `sudo usermod -aG docker $USER` |
| **VM IP changed after reboot** | Re-run agent with new IP: `python agent_core.py http://<NEW_IP>:5001` |
| **Container won't start** | Check logs: `sudo docker compose logs <service>`. Try rebuild: `sudo docker compose up -d --build --force-recreate` |
| **Port conflict** | Check what's using the port: `sudo lsof -i:5001`. Kill it: `sudo kill $(sudo lsof -ti:5001)` |
| **Database not initialized** | Reset: `sudo docker compose down -v && sudo docker compose up -d --build` |
