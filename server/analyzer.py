import json
import sys
import os
import time
import requests
import mysql.connector
from datetime import datetime

# DB Configuration
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'db'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', 'root'),
    'database': os.environ.get('DB_NAME', 'lotl_dfms')
}

OLLAMA_HOST = os.environ.get('OLLAMA_HOST', 'http://ollama:11434')
OLLAMA_MODEL = os.environ.get('OLLAMA_MODEL', 'llama3')

class LogAnalyzer:
    def __init__(self):
        self.db_conn = None
        self.connect_db()

    def connect_db(self):
        try:
            self.db_conn = mysql.connector.connect(**DB_CONFIG)
            print("Connected to MySQL Database")
        except Exception as e:
            print(f"DB Error: {e}")
            self.db_conn = None

    def ask_ollama(self, cmd_line, rule_name):
        prompt = f"Analyze this suspicious command detected by rule '{rule_name}':\n\nCommand: {cmd_line}\n\nExplain briefly (in 1-2 sentences) why this is dangerous and what the attacker might be trying to do."
        try:
            response = requests.post(f"{OLLAMA_HOST}/api/generate", json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}, timeout=10)
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "No analysis provided.")
            return f"AI Error: {response.status_code}"
        except Exception as e:
            return f"AI Connection Failed: {str(e)}"

    def get_or_create_host(self, hostname):
        if not self.db_conn: return None
        cursor = self.db_conn.cursor()
        try:
            # Check exist
            cursor.execute("SELECT host_id FROM lotl_host WHERE hostname = %s", (hostname,))
            res = cursor.fetchone()
            if res: return res[0]
            
            # Create
            cursor.execute("INSERT INTO lotl_host (hostname, environment, criticality, status) VALUES (%s, 'lab', 'medium', 'active')", (hostname,))
            self.db_conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Host ID Error: {e}")
            self.db_conn.reconnect(attempts=3, delay=2)
            return None

    def get_or_create_rule(self, rule_name):
        if not self.db_conn: return None
        cursor = self.db_conn.cursor()
        try:
            cursor.execute("SELECT rule_id FROM lotl_detection_rule WHERE rule_name = %s", (rule_name,))
            res = cursor.fetchone()
            if res: return res[0]
            
            # Create default
            cursor.execute("INSERT INTO lotl_detection_rule (rule_name, severity_default, logic_type, rule_content) VALUES (%s, 'high', 'keyword', 'auto-generated')", (rule_name,))
            self.db_conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Rule ID Error: {e}")
            return None

    def save_alert(self, hostname, rule_name, severity, details, ai_analysis):
        if not self.db_conn or not self.db_conn.is_connected():
            self.connect_db()
        
        if self.db_conn:
            try:
                host_id = self.get_or_create_host(hostname)
                rule_id = self.get_or_create_rule(rule_name)
                
                if not host_id or not rule_id:
                    print("Failed to resolve IDs for Host/Rule")
                    return

                cursor = self.db_conn.cursor()
                full_desc = f"{details}\n\nAI Analysis: {ai_analysis}"
                
                sql = "INSERT INTO lotl_alert_reference (host_id, rule_id, severity, description, timestamp, status, detection_source) VALUES (%s, %s, %s, %s, NOW(), 'new', 'rule')"
                val = (host_id, rule_id, severity.lower(), full_desc)
                cursor.execute(sql, val)
                self.db_conn.commit()
                print(f"Saved Alert: {rule_name} for {hostname}")
            except Exception as e:
                print(f"Failed to save alert: {e}")

    def analyze_log(self, log_entry):
        try:
            # DB returns tuple/dict depending on cursor. We'll fetch as dict.
            process = log_entry.get("process_name") or ""
            cmd_line = log_entry.get("command_line") or ""
            hostname = log_entry.get("hostname") or "Unknown-Host"
            
            process_lower = process.lower()
            cmd_line_lower = cmd_line.lower()

            # Rule 1: CertUtil
            if "certutil" in process_lower and any(x in cmd_line_lower for x in ["urlcache", "split", "decode"]):
                print(f"DETECTED: CertUtil Abuse on {hostname}")
                ai_explanation = self.ask_ollama(cmd_line, "CertUtil Abuse")
                self.save_alert(hostname, "CertUtil Download", "HIGH", cmd_line, ai_explanation)
                return "ALERT: CertUtil"

            # Rule 2: PowerShell Encoded
            if ("powershell" in process_lower or "pwsh" in process_lower) and any(x in cmd_line_lower for x in ["-enc", "-encodedcommand"]):
                print(f"DETECTED: Suspicious PowerShell on {hostname}")
                ai_explanation = self.ask_ollama(cmd_line, "Suspicious PowerShell")
                self.save_alert(hostname, "Suspicious PowerShell", "MEDIUM", cmd_line, ai_explanation)
                return "ALERT: PowerShell"

            return "CLEAN"

        except Exception as e:
            return f"ERROR: {str(e)}"

    def get_max_event_id(self):
        if not self.db_conn: return 0
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("SELECT MAX(event_id) FROM lotl_process_event")
            res = cursor.fetchone()
            return res[0] if res and res[0] else 0
        except Exception as e:
            print(f"Error getting max ID: {e}")
            return 0

    def fetch_new_events(self, last_id):
        if not self.db_conn: return []
        try:
            # Reconnect if needed
            if not self.db_conn.is_connected():
                self.db_conn.reconnect(attempts=3, delay=2)
            
            cursor = self.db_conn.cursor(dictionary=True)
            # Join with host table to get hostname
            sql = """
                SELECT e.*, h.hostname 
                FROM lotl_process_event e 
                LEFT JOIN lotl_host h ON e.host_id = h.host_id 
                WHERE e.event_id > %s 
                ORDER BY e.event_id ASC LIMIT 50
            """
            cursor.execute(sql, (last_id,))
            return cursor.fetchall()
        except Exception as e:
            print(f"Fetch Error: {e}")
            return []

def main():
    print("Starting Analysis Engine (Polling Mode)...")
    analyzer = LogAnalyzer()
    
    # Start from the latest event to avoid re-alerting on old data
    # Or start from 0 if we want to re-scan? Let's start from max for production-like behavior.
    last_processed_id = analyzer.get_max_event_id()
    print(f"Starting from Event ID: {last_processed_id}")

    while True:
        try:
            events = analyzer.fetch_new_events(last_processed_id)
            if events:
                print(f"Fetched {len(events)} new events.")
                for event in events:
                    analyzer.analyze_log(event)
                    last_processed_id = max(last_processed_id, event['event_id'])
            else:
                pass # No new events
            
            time.sleep(5) # Poll every 5 seconds
            
        except KeyboardInterrupt:
            print("Stopping...")
            break
        except Exception as e:
            print(f"Loop Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    time.sleep(10) # Wait for DB initialization
    main()
