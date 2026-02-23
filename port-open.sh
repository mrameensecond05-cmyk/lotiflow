#!/bin/bash
# ═══════════════════════════════════════════════════
#  LOTIflow Port Check — Server Health Validator
#  Run: chmod +x port-open.sh && ./port-open.sh
# ═══════════════════════════════════════════════════

GREEN="\033[92m"
RED="\033[91m"
YELLOW="\033[93m"
CYAN="\033[96m"
BOLD="\033[1m"
DIM="\033[2m"
RESET="\033[0m"

# ─── Define all LOTIflow ports ────────────────────
declare -A PORTS
PORTS=(
    [5001]="Backend API         (Node.js)"
    [8082]="Dashboard           (Nginx Proxy)"
    [3306]="MySQL Database      (Internal)"
    [3001]="Frontend Direct     (React Dev)"
    [8083]="phpMyAdmin          (DB Admin)"
    [11435]="Ollama AI           (LLM Service)"
    [22]="SSH                 (Remote Access)"
)

# Order for display
PORT_ORDER=(5001 8082 3306 3001 8083 11435 22)

PASS=0
FAIL=0
WARN=0

echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}${BOLD}║     LOTIflow Server Port Health Check        ║${RESET}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${RESET}"
echo ""

# ─── Get server IP ────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
echo -e "  ${BOLD}Server IP:${RESET} ${CYAN}${SERVER_IP}${RESET}"
echo -e "  ${BOLD}Hostname:${RESET}  $(hostname)"
echo -e "  ${BOLD}Time:${RESET}      $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "  ${DIM}─────────────────────────────────────────────${RESET}"

# ─── Check each port ─────────────────────────────
for PORT in "${PORT_ORDER[@]}"; do
    SERVICE="${PORTS[$PORT]}"
    
    # Check if port is listening
    if ss -tlnp 2>/dev/null | grep -q ":${PORT} " || \
       netstat -tlnp 2>/dev/null | grep -q ":${PORT} "; then
        echo -e "  ${GREEN}✅ OPEN${RESET}    :${BOLD}${PORT}${RESET}  →  ${SERVICE}"
        ((PASS++))
    else
        # Check if it's a critical port
        if [[ "$PORT" == "5001" || "$PORT" == "8082" || "$PORT" == "3306" ]]; then
            echo -e "  ${RED}❌ CLOSED${RESET}  :${BOLD}${PORT}${RESET}  →  ${SERVICE}"
            ((FAIL++))
        else
            echo -e "  ${YELLOW}⚠️  CLOSED${RESET}  :${BOLD}${PORT}${RESET}  →  ${SERVICE}"
            ((WARN++))
        fi
    fi
done

# ─── Firewall check ──────────────────────────────
echo ""
echo -e "  ${DIM}─────────────────────────────────────────────${RESET}"
echo -e "  ${BOLD}Firewall (UFW):${RESET}"

if command -v ufw &>/dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1)
    if echo "$UFW_STATUS" | grep -qi "active"; then
        echo -e "  ${GREEN}●${RESET} UFW is ${GREEN}active${RESET}"
        
        # Check important ports in firewall rules
        for PORT in 5001 8082 8083; do
            if sudo ufw status 2>/dev/null | grep -q "${PORT}"; then
                echo -e "    ${GREEN}✅${RESET} Port ${PORT} allowed"
            else
                echo -e "    ${RED}❌${RESET} Port ${PORT} ${RED}NOT in firewall rules${RESET}"
                echo -e "       ${DIM}Fix: sudo ufw allow ${PORT}/tcp${RESET}"
                ((FAIL++))
            fi
        done
    else
        echo -e "  ${YELLOW}●${RESET} UFW is ${YELLOW}inactive${RESET} (all ports accessible)"
    fi
else
    echo -e "  ${DIM}  UFW not installed${RESET}"
fi

# ─── Docker container check ──────────────────────
echo ""
echo -e "  ${DIM}─────────────────────────────────────────────${RESET}"
echo -e "  ${BOLD}Docker Containers:${RESET}"

if command -v docker &>/dev/null; then
    CONTAINERS=$(sudo docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}" 2>/dev/null | grep "lotiflow")
    
    if [ -z "$CONTAINERS" ]; then
        echo -e "  ${RED}❌ No LOTIflow containers running${RESET}"
        echo -e "     ${DIM}Fix: cd /opt/lotiflow && sudo docker compose up -d${RESET}"
        ((FAIL++))
    else
        while IFS='|' read -r NAME STATUS PORTS_MAP; do
            if echo "$STATUS" | grep -qi "up"; then
                echo -e "  ${GREEN}▶${RESET} ${NAME}  ${GREEN}${STATUS}${RESET}"
            else
                echo -e "  ${RED}■${RESET} ${NAME}  ${RED}${STATUS}${RESET}"
                ((FAIL++))
            fi
        done <<< "$CONTAINERS"
    fi
else
    echo -e "  ${YELLOW}⚠️  Docker not installed${RESET}"
fi

# ─── API health check ────────────────────────────
echo ""
echo -e "  ${DIM}─────────────────────────────────────────────${RESET}"
echo -e "  ${BOLD}API Health:${RESET}"

if command -v curl &>/dev/null; then
    # Backend API
    RESP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:5001/api/connection/verify 2>/dev/null)
    if [ "$RESP" == "200" ]; then
        BODY=$(curl -s --connect-timeout 3 http://localhost:5001/api/connection/verify 2>/dev/null)
        echo -e "  ${GREEN}✅${RESET} Backend API: ${GREEN}OK${RESET} (HTTP 200)"
        echo -e "     ${DIM}${BODY}${RESET}"
    else
        echo -e "  ${RED}❌${RESET} Backend API: ${RED}UNREACHABLE${RESET} (HTTP ${RESP})"
        ((FAIL++))
    fi

    # Dashboard
    RESP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:8082 2>/dev/null)
    if [ "$RESP" == "200" ] || [ "$RESP" == "304" ]; then
        echo -e "  ${GREEN}✅${RESET} Dashboard:   ${GREEN}OK${RESET} (HTTP ${RESP})"
    else
        echo -e "  ${RED}❌${RESET} Dashboard:   ${RED}UNREACHABLE${RESET} (HTTP ${RESP})"
        ((FAIL++))
    fi
else
    echo -e "  ${YELLOW}⚠️  curl not available — skipping API checks${RESET}"
fi

# ─── Summary ──────────────────────────────────────
echo ""
echo -e "  ${DIM}═════════════════════════════════════════════${RESET}"
TOTAL=$((PASS + FAIL + WARN))

if [ "$FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}🎉 ALL SYSTEMS OPERATIONAL${RESET}"
    echo -e "  ${GREEN}${PASS}/${TOTAL} checks passed${RESET}"
    echo ""
    echo -e "  ${DIM}Dashboard: http://${SERVER_IP}:8082${RESET}"
    echo -e "  ${DIM}Agent URL: http://${SERVER_IP}:5001${RESET}"
elif [ "$FAIL" -le 2 ]; then
    echo -e "  ${YELLOW}${BOLD}⚠️  PARTIAL — ${FAIL} issue(s) found${RESET}"
    echo -e "  ${GREEN}${PASS} passed${RESET} | ${RED}${FAIL} failed${RESET} | ${YELLOW}${WARN} warnings${RESET}"
else
    echo -e "  ${RED}${BOLD}🚨 CRITICAL — ${FAIL} issue(s) found${RESET}"
    echo -e "  ${GREEN}${PASS} passed${RESET} | ${RED}${FAIL} failed${RESET} | ${YELLOW}${WARN} warnings${RESET}"
    echo ""
    echo -e "  ${DIM}Quick fix: sudo docker compose up -d --build${RESET}"
fi

echo ""
